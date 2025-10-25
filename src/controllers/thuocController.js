// src/controllers/thuocController.js
import { Thuoc, DonViTinh, LoaiThuoc } from '../models/index.js'; // Cập nhật import
import { Op } from 'sequelize';

export async function listThuoc(req, res) {
    const { q, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (q) {
        const like = { [Op.iLike]: `%${q}%` };
        where[Op.or] = [
            { ten_thuoc: like },
            { ma_thuoc: like },
        ];
    }

    try {
        const items = await Thuoc.findAll({ where, limit: +limit, offset: +offset, order: [['id', 'ASC']] });
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}

export async function getThuoc(req, res) {
    try {
        const item = await Thuoc.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}

export async function createThuoc(req, res) {
    try {
        const item = await Thuoc.create(req.body);
        res.status(201).json(item);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
}

export async function updateThuoc(req, res) {
    try {
        const item = await Thuoc.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });
        await item.update(req.body);
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
}

export async function deleteThuoc(req, res) {
    try {
        const item = await Thuoc.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });
        await item.destroy();
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}

// ====== HÀM MỚI CHO DROPDOWN (START) ======

export async function listDonViTinh(req, res) {
    try {
        const items = await DonViTinh.findAll({
            attributes: ['id', 'ten'],
            order: [['ten', 'ASC']]
        });
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}

export async function listLoaiThuoc(req, res) {
    try {
        const items = await LoaiThuoc.findAll({
            attributes: ['id', 'ten'],
            order: [['ten', 'ASC']]
        });
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}
// ====== HÀM MỚI CHO DROPDOWN (END) ======