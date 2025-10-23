import { LoThuoc, Thuoc } from '../models/index.js';
import { Op, fn, col, literal } from 'sequelize';

// GET /api/ton-kho/tong
// Trả về tổng tồn theo thuốc: [{ thuoc_id, ma_thuoc, ten_thuoc, tong_so_luong, so_lo }]
export async function tongTon(req, res) {
    try {
        // Cho phép nhóm linh hoạt theo: id (mặc định), code (ma_thuoc), name (ten_thuoc)
        const by = (req.query.by || 'id').toString().toLowerCase();

        if (by === 'id') {
            // Giữ nguyên: tổng theo từng thuốc_id
            const rows = await LoThuoc.findAll({
                attributes: [
                    'thuoc_id',
                    [fn('SUM', col('LoThuoc.so_luong')), 'tong_so_luong'],
                    [
                        literal('COUNT(DISTINCT ("LoThuoc"."so_lo", "LoThuoc"."han_dung"))'),
                        'so_lo',
                    ],
                ],
                where: { so_luong: { [Op.gt]: 0 } },
                include: [
                    {
                        model: Thuoc,
                        as: 'thuoc',
                        attributes: ['ma_thuoc', 'ten_thuoc'],
                    },
                ],
                group: ['LoThuoc.thuoc_id', 'thuoc.id'],
                order: [[literal('tong_so_luong'), 'DESC']],
                raw: false,
            });

            const data = rows.map((r) => ({
                thuoc_id: r.thuoc_id,
                ma_thuoc: r.thuoc?.ma_thuoc || null,
                ten_thuoc: r.thuoc?.ten_thuoc || null,
                tong_so_luong: Number(r.get('tong_so_luong')) || 0,
                so_lo: Number(r.get('so_lo')) || 0,
            }));
            return res.json(data);
        }

        // Nhóm theo mã thuốc (code) hoặc tên thuốc (name)
        const groupByCode = by === 'code';
        const groupField = groupByCode ? 'thuoc.ma_thuoc' : 'thuoc.ten_thuoc';

        // Lấy dữ liệu phẳng (raw) để dễ map các alias tuỳ chỉnh
        const rows = await LoThuoc.findAll({
            attributes: [
                // Trường hiển thị nhóm
                [col(groupField), groupByCode ? 'ma_thuoc' : 'ten_thuoc'],
                // Lấy một tên/mã đại diện ổn định cho nhóm còn lại
                groupByCode
                    ? [literal('MIN("thuoc"."ten_thuoc")'), 'ten_thuoc']
                    : [literal('MIN("thuoc"."ma_thuoc")'), 'ma_thuoc'],
                // Tổng số lượng và số lô distinct theo cặp (so_lo, han_dung)
                [fn('SUM', col('LoThuoc.so_luong')), 'tong_so_luong'],
                [
                    literal('COUNT(DISTINCT ("LoThuoc"."so_lo", "LoThuoc"."han_dung"))'),
                    'so_lo',
                ],
            ],
            where: { so_luong: { [Op.gt]: 0 } },
            include: [
                {
                    model: Thuoc,
                    as: 'thuoc',
                    attributes: [], // dùng alias trên attributes thay vì nested object
                },
            ],
            group: [groupField],
            order: [[literal('tong_so_luong'), 'DESC']],
            raw: true,
        });

        const data = rows.map((r) => ({
            thuoc_id: null,
            ma_thuoc: r.ma_thuoc ?? null,
            ten_thuoc: r.ten_thuoc ?? null,
            tong_so_luong: Number(r.tong_so_luong) || 0,
            so_lo: Number(r.so_lo) || 0,
        }));

        return res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}
