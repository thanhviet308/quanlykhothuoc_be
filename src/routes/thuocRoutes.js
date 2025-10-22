import express from 'express';
import * as controller from '../controllers/thuocController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ====== ROUTES ======

// Lấy danh sách thuốc (chỉ người đã đăng nhập)
router.get('/', requireAuth, controller.listThuoc);

// ====== ROUTES TĨNH CHO DROPDOWN (ĐỂ TRƯỚC ":id") ======
// Lấy danh sách Đơn vị tính (chỉ người đã đăng nhập)
router.get('/don-vi-tinh', requireAuth, controller.listDonViTinh);
// Lấy danh sách Loại thuốc (chỉ người đã đăng nhập)
router.get('/loai-thuoc', requireAuth, controller.listLoaiThuoc);

// Tạo thuốc mới (chỉ ADMIN)
router.post('/', requireAuth, requireRole('ADMIN'), controller.createThuoc);

// Cập nhật thuốc (chỉ ADMIN)
router.put('/:id', requireAuth, requireRole('ADMIN'), controller.updateThuoc);

// Xóa thuốc (chỉ ADMIN)
router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.deleteThuoc);

// Xem chi tiết thuốc theo ID (để cuối cùng để không nuốt các route tĩnh ở trên)
router.get('/:id', requireAuth, controller.getThuoc);

export default router;