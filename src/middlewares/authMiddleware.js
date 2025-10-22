// src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { NguoiDung } from "../models/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// Chuẩn hoá role về UPPERCASE
const normRole = (r) => String(r || "").trim().toUpperCase();

/**
 * Yêu cầu Bearer token hợp lệ, nạp user vào req.user
 */
export async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Thiếu token xác thực" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        // Hỗ trợ cả id và uid để tương thích token cũ
        const userId = payload.id ?? payload.uid;
        if (!userId) {
            return res.status(401).json({ message: "Token không hợp lệ (thiếu id)" });
        }

        const user = await NguoiDung.findByPk(userId);
        if (!user) {
            return res.status(401).json({ message: "Tài khoản không còn tồn tại" });
        }

        // (tuỳ chọn) Nếu có cột hoat_dong và bạn muốn chặn tài khoản bị khoá:
        // if (user.hoat_dong === false) {
        //   return res.status(403).json({ message: "Tài khoản đã bị khoá" });
        // }

        req.user = {
            id: user.id,
            username: user.username,
            role: normRole(user.role), // luôn là UPPERCASE
        };

        return next();
    } catch (err) {
        console.error("Lỗi xác thực token:", err?.message);
        return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
}

/**
 * Chỉ cho phép các vai trò nhất định
 * Ví dụ: requireRole("ADMIN"), requireRole("ADMIN","STAFF")
 */
export function requireRole(...allowedRoles) {
    const allow = allowedRoles.map(normRole); // so sánh không phân biệt hoa/thường
    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({ message: "Chưa xác thực người dùng" });
        }
        const role = normRole(req.user.role);
        if (!allow.includes(role)) {
            return res.status(403).json({ message: "Bạn không có quyền truy cập trang này" });
        }
        return next();
    };
}


