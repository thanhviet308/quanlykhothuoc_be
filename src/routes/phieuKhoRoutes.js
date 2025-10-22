// src/routes/phieuKhoRoutes.js
import express from 'express';
import { nhapKho, xuatKho } from '../controllers/phieuKhoController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Cả ADMIN và STAFF đều được tạo phiếu nhập/xuất
router.post('/nhap', requireAuth, requireRole('ADMIN', 'STAFF'), nhapKho);
router.post('/xuat', requireAuth, requireRole('ADMIN', 'STAFF'), xuatKho);

export default router;
