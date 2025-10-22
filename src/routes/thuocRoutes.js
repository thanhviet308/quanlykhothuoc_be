import express from 'express';
import * as controller from '../controllers/thuocController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ====== ROUTES ======

// Lấy danh sách thuốc (chỉ người đã đăng nhập)
router.get('/', requireAuth, controller.listThuoc);

// Xem chi tiết thuốc theo ID
router.get('/:id', requireAuth, controller.getThuoc);

// Tạo thuốc mới (chỉ ADMIN)
router.post('/', requireAuth, requireRole('ADMIN'), controller.createThuoc);

// Cập nhật thuốc (chỉ ADMIN)
router.put('/:id', requireAuth, requireRole('ADMIN'), controller.updateThuoc);

// Xóa thuốc (chỉ ADMIN)
router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.deleteThuoc);

export default router;
