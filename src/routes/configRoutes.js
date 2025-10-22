// src/routes/configRoutes.js
import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js'; // 💡 CẬP NHẬT: Import middleware
import { getDashboardData } from '../controllers/dashboardController.js'; // 💡 CẬP NHẬT: Import controller

const router = express.Router();

// Return public API base URL so clients can auto-configure
router.get('/config', (req, res) => {
    // Prefer explicit env if provided; otherwise compute from request host
    const apiBaseUrl = process.env.PUBLIC_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ apiBaseUrl });
});

// 💡 ROUTE MỚI: API cho Dashboard (Yêu cầu đăng nhập)
router.get('/dashboard', requireAuth, getDashboardData);

export default router;