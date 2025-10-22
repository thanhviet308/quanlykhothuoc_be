import { PhieuKho, PhieuKhoCT, Thuoc, LoThuoc } from '../models/index.js';
import { sequelize } from '../config/database.js';

// Nhập kho: tạo phiếu và chi tiết, cộng vào số lượng lô (nếu lo_id provided) or tạo lô mới
export async function nhapKho(req, res) {
    const t = await sequelize.transaction();
    try {
        const { so_phieu, loai, ngay_phieu, ghi_chu, nguoi_lap_id, chi_tiets } = req.body;
        const phieu = await PhieuKho.create({ so_phieu, loai, ngay_phieu, ghi_chu, nguoi_lap_id }, { transaction: t });

        for (const ct of chi_tiets) {
            const { thuoc_id, lo_id, so_luong, don_gia } = ct;
            await PhieuKhoCT.create({ phieu_id: phieu.id, thuoc_id, lo_id, so_luong, don_gia }, { transaction: t });

            if (lo_id) {
                const lo = await LoThuoc.findByPk(lo_id, { transaction: t });
                if (lo) {
                    lo.so_luong = (lo.so_luong || 0) + so_luong;
                    await lo.save({ transaction: t });
                }
            } else {
                // create a new lot
                await LoThuoc.create({ thuoc_id, so_lo: ct.so_lo || null, han_dung: ct.han_dung || null, so_luong, gia_nhap: don_gia }, { transaction: t });
            }
        }

        await t.commit();
        res.status(201).json({ phieu_id: phieu.id });
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
        const { so_phieu, loai, ngay_phieu, ghi_chu, nguoi_lap_id, chi_tiets } = req.body;
        const phieu = await PhieuKho.create({ so_phieu, loai, ngay_phieu, ghi_chu, nguoi_lap_id }, { transaction: t });

        for (const ct of chi_tiets) {
            let { thuoc_id, so_luong, don_gia } = ct;
            let qtyLeft = so_luong;

            // find lots ordered by earliest han_dung
            const lots = await LoThuoc.findAll({ where: { thuoc_id }, order: [['han_dung', 'ASC']], transaction: t });

            for (const lot of lots) {
                if (qtyLeft <= 0) break;
                const take = Math.min(lot.so_luong || 0, qtyLeft);
                if (take <= 0) continue;

                await PhieuKhoCT.create({ phieu_id: phieu.id, thuoc_id, lo_id: lot.id, so_luong: take, don_gia }, { transaction: t });
                lot.so_luong = (lot.so_luong || 0) - take;
                await lot.save({ transaction: t });
                qtyLeft -= take;
            }

            if (qtyLeft > 0) {
                throw new Error(`Không đủ tồn để xuất thuốc_id=${thuoc_id}. Thiếu ${qtyLeft}`);
            }
        }

        await t.commit();
        res.status(201).json({ phieu_id: phieu.id });
    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(400).json({ message: err.message });
    }
}
