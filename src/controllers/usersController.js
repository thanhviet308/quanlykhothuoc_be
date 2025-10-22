// src/controllers/usersController.js
import { Op } from 'sequelize';
import { NguoiDung } from '../models/index.js';
import bcrypt from 'bcrypt';

const norm = (s) => (s ?? '').toString().trim();
const normRole = (r) => norm(r).toUpperCase();

export async function listUsers(req, res) {
    try {
        let { q = '', page = 1, limit = 20, role = '', active } = req.query;
        page = Math.max(1, parseInt(page));
        limit = Math.min(100, Math.max(1, parseInt(limit)));
        const where = {};
        if (q) {
            q = q.trim();
            where[Op.or] = [
                { username: { [Op.iLike]: `%${q}%` } },
                { ho_ten: { [Op.iLike]: `%${q}%` } },
                { email: { [Op.iLike]: `%${q}%` } },
            ];
        }
        if (role) where.role = normRole(role);
        if (active === '1') where.hoat_dong = true; else if (active === '0') where.hoat_dong = false;

        const offset = (page - 1) * limit;
        const { rows, count } = await NguoiDung.findAndCountAll({
            where,
            offset,
            limit,
            order: [['id', 'ASC']],
            attributes: ['id', 'username', 'ho_ten', 'email', 'role', 'hoat_dong'],
        });
        return res.json({ data: rows, total: count, page, pages: Math.max(1, Math.ceil(count / limit)) });
    } catch (err) {
        console.error('listUsers error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export async function getUser(req, res) {
    try {
        const u = await NguoiDung.findByPk(req.params.id, {
            attributes: ['id', 'username', 'ho_ten', 'email', 'role', 'hoat_dong'],
        });
        if (!u) return res.status(404).json({ message: 'Not found' });
        return res.json(u);
    } catch (err) {
        console.error('getUser error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export async function createUser(req, res) {
    try {
        const { username, password, ho_ten, email, role = 'STAFF', hoat_dong = true } = req.body || {};
        if (!username || !password) return res.status(400).json({ message: 'username & password required' });
        const exists = await NguoiDung.findOne({ where: { username } });
        if (exists) return res.status(409).json({ message: 'Username already exists' });
        const mat_khau_bam = await bcrypt.hash(password, 10);
        const u = await NguoiDung.create({ username, mat_khau_bam, ho_ten, email, role: normRole(role), hoat_dong });
        return res.status(201).json({ id: u.id });
    } catch (err) {
        console.error('createUser error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export async function updateUser(req, res) {
    try {
        const u = await NguoiDung.findByPk(req.params.id);
        if (!u) return res.status(404).json({ message: 'Not found' });

        const { username, password, ho_ten, email, role, hoat_dong } = req.body || {};
        if (username) u.username = username;
        if (typeof ho_ten !== 'undefined') u.ho_ten = ho_ten;
        if (typeof email !== 'undefined') u.email = email;
        if (typeof role !== 'undefined') u.role = normRole(role);
        if (typeof hoat_dong !== 'undefined') u.hoat_dong = !!hoat_dong;
        if (password) u.mat_khau_bam = await bcrypt.hash(password, 10);

        await u.save();
        return res.json({ message: 'Updated' });
    } catch (err) {
        console.error('updateUser error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export async function deleteUser(req, res) {
    try {
        const u = await NguoiDung.findByPk(req.params.id);
        if (!u) return res.status(404).json({ message: 'Not found' });
        await u.destroy();
        return res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('deleteUser error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export async function setActive(req, res) {
    try {
        const u = await NguoiDung.findByPk(req.params.id);
        if (!u) return res.status(404).json({ message: 'Not found' });
        const { active } = req.body || {};
        if (typeof active === 'undefined') return res.status(400).json({ message: 'active required' });
        u.hoat_dong = !!active;
        await u.save();
        return res.json({ message: 'Updated' });
    } catch (err) {
        console.error('setActive error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
