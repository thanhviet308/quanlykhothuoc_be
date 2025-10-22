// src/controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NguoiDung } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

const normRole = (r) => String(r || '').trim().toUpperCase();
const normUser = (u) => String(u || '').trim().toLowerCase();

export async function login(req, res) {
    const username = normUser(req.body?.username);
    const password = String(req.body?.password || '');

    if (!username || !password) {
        return res.status(400).json({ message: 'username and password required' });
    }

    try {
        const user = await NguoiDung.findOne({ where: { username } });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        if (user.hoat_dong === false) {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
        }

        const ok = await bcrypt.compare(password, user.mat_khau_bam);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

        const role = normRole(user.role); // 👈 chuẩn hoá role
        const token = jwt.sign({ id: user.id, username: user.username, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

        return res.json({
            token,
            user: { id: user.id, username: user.username, ho_ten: user.ho_ten, role },
        });
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export async function me(req, res) {
    try {
        const id = req.user?.id;
        if (!id) return res.status(401).json({ message: 'Unauthorized' });

        const u = await NguoiDung.findByPk(id, {
            attributes: ['id', 'username', 'ho_ten', 'email', 'role', 'hoat_dong'],
        });
        if (!u) return res.status(404).json({ message: 'User not found' });

        if (u.hoat_dong === false) {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
        }

        // 👇 trả role ở dạng UPPERCASE để guard phía FE so sánh chính xác
        const role = normRole(u.role);
        return res.json({
            user: {
                id: u.id,
                username: u.username,
                ho_ten: u.ho_ten,
                email: u.email,
                role,
                hoat_dong: u.hoat_dong,
            },
        });
    } catch (err) {
        console.error('me error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export async function changePassword(req, res) {
    const userId = req.user?.id;
    const oldPassword = String(req.body?.oldPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'oldPassword and newPassword required' });
    }

    try {
        const user = await NguoiDung.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const ok = await bcrypt.compare(oldPassword, user.mat_khau_bam);
        if (!ok) return res.status(400).json({ message: 'Old password incorrect' });

        user.mat_khau_bam = await bcrypt.hash(newPassword, 10);
        await user.save();
        return res.json({ message: 'Password changed' });
    } catch (err) {
        console.error('changePassword error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export async function register(req, res) {
    const username = normUser(req.body?.username);
    const password = String(req.body?.password || '');
    const ho_ten = String(req.body?.ho_ten || '');
    const email = normUser(req.body?.email);

    if (!username || !password) {
        return res.status(400).json({ message: 'username and password required' });
    }

    try {
        const exists = await NguoiDung.findOne({ where: { username } });
        if (exists) return res.status(409).json({ message: 'Username already exists' });

        const mat_khau_bam = await bcrypt.hash(password, 10);
        const user = await NguoiDung.create({
            username, mat_khau_bam, ho_ten, email,
            role: 'STAFF', hoat_dong: true
        });

        return res.status(201).json({ id: user.id, username: user.username, role: normRole(user.role) });
    } catch (err) {
        console.error('register error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export async function logout(req, res) {
    try {
        const userId = req.user?.id;
        if (userId) {
            console.log(`User ${userId} logged out at ${new Date().toISOString()}`);
        }
        return res.json({ message: 'Đăng xuất thành công' });
    } catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Lỗi server khi đăng xuất' });
    }
}
