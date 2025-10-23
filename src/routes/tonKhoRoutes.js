import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { tongTon } from '../controllers/tonKhoController.js';

const router = express.Router();

// Tổng tồn theo thuốc
router.get('/tong', requireAuth, tongTon);

export default router;
