// src/controllers/phieuKhoController.js
import { PhieuKho, PhieuKhoCT, Thuoc, LoThuoc, NguoiDung, DonViTinh } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';

// Nhập kho: tạo phiếu và chi tiết, cộng vào số lượng lô (nếu lo_id provided) or tạo lô mới
export async function nhapKho(req, res) {
    const t = await sequelize.transaction();
    try {
        const nguoi_lap_id = req.user.id;
        const { so_phieu, loai, ngay_phieu, ghi_chu, chi_tiets } = req.body;

        // 1. Tạo phiếu kho (PhieuKho)
        const phieu = await PhieuKho.create({ so_phieu, loai, ngay_phieu, ghi_chu, nguoi_lap_id }, { transaction: t });

        // 2. Xử lý chi tiết
        for (const ct of chi_tiets) {
            const { thuoc_id, so_luong, don_gia } = ct;
            let loIdToUse = ct.lo_id; // ID của Lô sẽ được sử dụng cho Chi tiết Phiếu

            if (loIdToUse) {
                // Scenario 1: Cập nhật Lô có sẵn
                const lo = await LoThuoc.findByPk(loIdToUse, { transaction: t });
                if (!lo) {
                    throw new Error(`Lô ID ${loIdToUse} không tồn tại.`);
                }
                lo.so_luong = (lo.so_luong || 0) + so_luong;
                await lo.save({ transaction: t });
            } else {
                // Scenario 2: Tạo Lô mới
                const newLo = await LoThuoc.create({
                    thuoc_id,
                    so_lo: ct.so_lo || null,
                    han_dung: ct.han_dung || null,
                    so_luong,
                    gia_nhap: don_gia
                }, { transaction: t });
                loIdToUse = newLo.id; // Lấy ID của Lô mới vừa tạo
            }

            // 3. Tạo chi tiết phiếu kho (PhieuKhoCT) sử dụng loIdToUse đã xác định
            await PhieuKhoCT.create({ phieu_id: phieu.id, thuoc_id, lo_id: loIdToUse, so_luong, don_gia }, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ phieu_id: phieu.id, so_phieu: phieu.so_phieu });
    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}

// Xuất kho: FEFO (first-expire-first-out) - choose lots by earliest expiration
export async function xuatKho(req, res) {
    const t = await sequelize.transaction();
    try {
        // 💡 CẬP NHẬT: Lấy nguoi_lap_id từ token
        const nguoi_lap_id = req.user.id;

        const { so_phieu, loai, ngay_phieu, ghi_chu, chi_tiets } = req.body;

        // Tạo phiếu kho
        const phieu = await PhieuKho.create({ so_phieu, loai, ngay_phieu, ghi_chu, nguoi_lap_id }, { transaction: t });

        for (const ct of chi_tiets) {
            let { thuoc_id, so_luong, don_gia } = ct;
            let qtyLeft = so_luong;

            // find lots ordered by earliest han_dung
            // Chỉ xuất những lô còn tồn
            const lots = await LoThuoc.findAll({
                where: { thuoc_id, so_luong: { [Op.gt]: 0 } },
                order: [
                    ['han_dung', 'ASC'], // Tiêu chí 1: Hạn dùng sớm nhất (FEFO)
                    ['id', 'ASC']        // 💡 SỬA LỖI: Tiêu chí 2: ID nhỏ nhất (FIFO) nếu HSD trùng
                ],
                transaction: t
            });

            for (const lot of lots) {
                if (qtyLeft <= 0) break;
                const take = Math.min(lot.so_luong || 0, qtyLeft);
                if (take <= 0) continue;

                // 💡 CẬP NHẬT: Ghi lại chi tiết phiếu xuất với số lượng âm
                await PhieuKhoCT.create({ phieu_id: phieu.id, thuoc_id, lo_id: lot.id, so_luong: take * -1, don_gia }, { transaction: t });

                // Trừ tồn kho
                lot.so_luong = (lot.so_luong || 0) - take;
                await lot.save({ transaction: t });
                qtyLeft -= take;
            }

            if (qtyLeft > 0) {
                throw new Error(`Không đủ tồn để xuất thuốc_id=${thuoc_id}. Thiếu ${qtyLeft}`);
            }
        }

        await t.commit();
        res.status(201).json({ phieu_id: phieu.id, so_phieu: phieu.so_phieu });
    } catch (err) {
        await t.rollback();
        console.error(err);
        // Trả về 400 nếu lỗi liên quan đến nghiệp vụ (không đủ tồn)
        const statusCode = err.message.includes('Không đủ tồn') ? 400 : 500;
        res.status(statusCode).json({ message: err.message });
    }
}


// 💡 HÀM MỚI: Lấy danh sách các phiếu kho
export async function listPhieu(req, res) {
    try {
        let { q = '', page = 1, limit = 20, loai = '' } = req.query;
        page = Math.max(1, parseInt(page));
        limit = Math.min(100, Math.max(1, parseInt(limit)));

        const where = {};
        if (q) {
            q = q.trim();
            where.so_phieu = { [Op.iLike]: `%${q}%` };
        }
        if (loai) {
            where.loai = loai.toUpperCase();
        }

        const offset = (page - 1) * limit;

        const { rows, count } = await PhieuKho.findAndCountAll({
            where,
            offset,
            limit,
            order: [['ngay_phieu', 'DESC'], ['id', 'DESC']],
            attributes: ['id', 'so_phieu', 'loai', 'ngay_phieu', 'ghi_chu', 'created_at'],
            include: [{ model: NguoiDung, as: 'nguoi_lap', attributes: ['username', 'ho_ten'] }]
        });

        const formattedRows = rows.map(p => {
            // Định dạng ngay_phieu sang DD/MM/YYYY
            const ngayPhieuISO = p.ngay_phieu?.toISOString().split('T')[0];
            const ngayPhieuFormatted = ngayPhieuISO ? ngayPhieuISO.split('-').reverse().join('/') : null;

            return {
                id: p.id,
                so_phieu: p.so_phieu,
                loai: p.loai,
                ngay_phieu: ngayPhieuFormatted, // 💡 ĐÃ SỬA: DD/MM/YYYY
                ghi_chu: p.ghi_chu,
                nguoi_lap: p.nguoi_lap?.ho_ten || p.nguoi_lap?.username || 'System',
                created_at: p.created_at.toISOString(),
            };
        });

        res.json({
            data: formattedRows,
            total: count,
            page,
            pages: Math.max(1, Math.ceil(count / limit))
        });

    } catch (err) {
        console.error('listPhieu error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách phiếu', error: err.message });
    }
}


// 💡 HÀM MỚI: Xem chi tiết một phiếu kho
export async function getPhieu(req, res) {
    try {
        const phieuId = req.params.id;
        const phieu = await PhieuKho.findByPk(phieuId, {
            attributes: ['id', 'so_phieu', 'loai', 'ngay_phieu', 'ghi_chu', 'created_at'],
            include: [
                { model: NguoiDung, as: 'nguoi_lap', attributes: ['username', 'ho_ten'] },
                {
                    model: PhieuKhoCT,
                    as: 'chi_tiets',
                    attributes: ['id', 'so_luong', 'don_gia'],
                    include: [
                        {
                            model: Thuoc,
                            as: 'thuoc',
                            attributes: ['ma_thuoc', 'ten_thuoc'],
                            include: [{ model: DonViTinh, as: 'don_vi_tinh', attributes: ['ten'] }]
                        },
                        {
                            model: LoThuoc,
                            as: 'lo_thuoc',
                            attributes: ['so_lo', 'han_dung']
                        }
                    ]
                }
            ]
        });

        if (!phieu) {
            return res.status(404).json({ message: 'Phiếu kho không tồn tại' });
        }

        // Định dạng ngay_phieu
        const ngayPhieuISO = phieu.ngay_phieu?.toISOString().split('T')[0];
        const ngayPhieuFormatted = ngayPhieuISO ? ngayPhieuISO.split('-').reverse().join('/') : null;

        const formattedDetails = phieu.chi_tiets.map(ct => {
            // Định dạng han_dung
            const hanDungISO = ct.lo_thuoc?.han_dung?.toISOString().split('T')[0];
            const hanDungFormatted = hanDungISO ? hanDungISO.split('-').reverse().join('/') : null;

            return {
                id: ct.id,
                ma_thuoc: ct.thuoc.ma_thuoc,
                ten_thuoc: ct.thuoc.ten_thuoc,
                don_vi_tinh: ct.thuoc.don_vi_tinh?.ten || null,
                so_lo: ct.lo_thuoc?.so_lo || null,
                han_dung: hanDungFormatted, // 💡 ĐÃ SỬA: DD/MM/YYYY
                so_luong: ct.so_luong,
                don_gia: ct.don_gia,
                thanh_tien: (ct.so_luong * (ct.don_gia || 0)).toFixed(2),
            };
        });

        res.json({
            id: phieu.id,
            so_phieu: phieu.so_phieu,
            loai: phieu.loai,
            ngay_phieu: ngayPhieuFormatted, // 💡 ĐÃ SỬA: DD/MM/YYYY
            ghi_chu: phieu.ghi_chu,
            nguoi_lap: phieu.nguoi_lap?.ho_ten || phieu.nguoi_lap?.username || 'System',
            created_at: phieu.created_at.toISOString(),
            chi_tiets: formattedDetails,
        });

    } catch (err) {
        console.error('getPhieu error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy chi tiết phiếu', error: err.message });
    }
}