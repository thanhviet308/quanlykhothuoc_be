// src/controllers/dashboardController.js
import { Thuoc, LoThuoc, PhieuKho, NguoiDung } from '../models/index.js';
import { Op } from 'sequelize';

// Số ngày để tính "sắp hết hạn" (2 tháng)
const NEAR_EXPIRY_DAYS = 60;
// Số lượng item tối đa cho Cảnh báo và Phiếu gần đây
const LIMIT = 5;

export async function getDashboardData(req, res) {
    try {
        const today = new Date();
        const next60Days = new Date();
        next60Days.setDate(today.getDate() + NEAR_EXPIRY_DAYS);

        // --- 1. Thống kê KPI ---
        // Tổng số loại thuốc đang hoạt động
        const totalDrugs = await Thuoc.count({ where: { hoat_dong: true } });
        // Tổng số lượng viên/hộp đang còn tồn kho
        const totalOnHand = await LoThuoc.sum('so_luong', { where: { so_luong: { [Op.gt]: 0 } } });

        // Đếm số lô đang còn tồn (>0) và đã hết hạn (han_dung < today)
        const expiredCount = await LoThuoc.count({
            where: {
                so_luong: { [Op.gt]: 0 },
                han_dung: { [Op.lt]: today },
            }
        });

        // Đếm số lô đang còn tồn (>0) và sắp hết hạn (today <= han_dung <= next60Days)
        const nearExpiryCount = await LoThuoc.count({
            where: {
                so_luong: { [Op.gt]: 0 },
                han_dung: { [Op.between]: [today, next60Days] }
            }
        });

        // --- 2. Danh sách Cảnh báo (Expired hoặc Near Expiry) ---
        const warnings = await LoThuoc.findAll({
            where: {
                so_luong: { [Op.gt]: 0 },
                [Op.or]: [
                    { han_dung: { [Op.lt]: today } }, // Quá hạn
                    { han_dung: { [Op.between]: [today, next60Days] } } // Sắp hết hạn
                ]
            },
            limit: LIMIT,
            order: [['han_dung', 'ASC']],
            include: [{ model: Thuoc, as: 'thuoc', attributes: ['ma_thuoc', 'ten_thuoc'] }]
        });

        const formattedWarnings = warnings.map(w => ({
            ma_thuoc: w.thuoc.ma_thuoc,
            ten_thuoc: w.thuoc.ten_thuoc,
            so_lo: w.so_lo,
            han_dung: w.han_dung.toISOString().split('T')[0],
            so_luong_ton: w.so_luong,
            ly_do: w.han_dung < today ? 'Quá hạn' : 'Sắp hết hạn',
            lo_id: w.id,
        }));


        // --- 3. Phiếu gần đây ---
        const recentPhieu = await PhieuKho.findAll({
            limit: LIMIT,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'so_phieu', 'loai', 'ngay_phieu', 'nguoi_lap_id', 'created_at'],
            include: [{ model: NguoiDung, as: 'nguoi_lap', attributes: ['username', 'ho_ten'] }]
        });

        const formattedRecentPhieu = recentPhieu.map(p => ({
            id: p.id,
            so_phieu: p.so_phieu,
            loai: p.loai,
            ngay_phieu: p.ngay_phieu ? p.ngay_phieu.toISOString().split('T')[0] : p.created_at.toISOString().split('T')[0],
            nguoi_lap: p.nguoi_lap?.ho_ten || p.nguoi_lap?.username || 'System User',
        }));

        res.json({
            totalDrugs: totalDrugs,
            nearExpiry: nearExpiryCount,
            expired: expiredCount,
            totalOnHand: totalOnHand || 0,
            warnings: formattedWarnings,
            recentPhieu: formattedRecentPhieu,
        });

    } catch (err) {
        console.error('getDashboardData error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu dashboard', error: err.message });
    }
}