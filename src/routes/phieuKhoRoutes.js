// src/routes/phieuKhoRoutes.js
import express from 'express';
import { nhapKho, xuatKho, listPhieu, getPhieu, deletePhieu } from '../controllers/phieuKhoController.js'; // Import listPhieu, getPhieu
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Cả ADMIN và STAFF đều được tạo phiếu nhập/xuất
router.post('/nhap', requireAuth, requireRole('ADMIN', 'STAFF'), nhapKho);
router.post('/xuat', requireAuth, requireRole('ADMIN', 'STAFF'), xuatKho);

// 💡 ROUTE MỚI: Lấy danh sách phiếu (Nhập/Xuất)
router.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), listPhieu);
// 💡 ROUTE MỚI: Xem chi tiết phiếu theo ID
router.get('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), getPhieu);
// 💡 ROUTE CẬP NHẬT: Cập nhật Phiếu (Chỉ ADMIN)
// (Đã bỏ các route cập nhật phiếu và chi tiết để vô hiệu hóa chức năng cập nhật)
// 💡 ROUTE XÓA: Xóa Phiếu (Chỉ ADMIN)
router.delete('/:id', requireAuth, requireRole('ADMIN'), deletePhieu);

export default router;