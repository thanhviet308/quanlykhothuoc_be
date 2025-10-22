// src/controllers/loThuocController.js
import { LoThuoc, Thuoc, DonViTinh } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Lấy danh sách lô thuốc, hỗ trợ tìm kiếm và lọc.
 * Mặc định chỉ lấy lô còn tồn kho (so_luong > 0).
 */
export async function listLoThuoc(req, res) {
    try {
        let { q = '', limit = 50, offset = 0, thuoc_id, include_zero } = req.query;
        limit = parseInt(limit) || 50;
        offset = parseInt(offset) || 0;

        const where = {};

        if (q) {
            q = q.trim();
            // Tìm theo số lô (so_lo)
            where.so_lo = { [Op.iLike]: `%${q}%` };
        }

        if (thuoc_id) {
            where.thuoc_id = thuoc_id;
        }

        // Mặc định: chỉ lấy lô còn tồn kho
        if (include_zero !== '1') {
            where.so_luong = { [Op.gt]: 0 };
        }

        // Lấy danh sách lô thuốc với thông tin thuốc liên quan
        const { rows, count } = await LoThuoc.findAndCountAll({
            where,
            offset,
            limit,
            order: [['han_dung', 'ASC']],
            include: [{
                model: Thuoc,
                as: 'thuoc',
                attributes: ['ma_thuoc', 'ten_thuoc'],
                include: [{ model: DonViTinh, as: 'don_vi_tinh', attributes: ['ten'] }]
            }]
        });

        const formattedRows = rows.map(l => ({
            id: l.id,
            thuoc_id: l.thuoc_id,
            ma_thuoc: l.thuoc.ma_thuoc,
            ten_thuoc: l.thuoc.ten_thuoc,
            don_vi_tinh: l.thuoc.don_vi_tinh?.ten,
            so_lo: l.so_lo,
            han_dung: l.han_dung ? l.han_dung.toISOString().split('T')[0] : null,
            so_luong: l.so_luong,
            gia_nhap: l.gia_nhap,
        }));

        res.json({
            data: formattedRows,
            total: count,
            limit,
            offset
        });

    } catch (err) {
        console.error('listLoThuoc error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách lô thuốc', error: err.message });
    }
}