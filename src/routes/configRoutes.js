import express from 'express';

const router = express.Router();

// Return public API base URL so clients can auto-configure
router.get('/config', (req, res) => {
    // Prefer explicit env if provided; otherwise compute from request host
    const apiBaseUrl = process.env.PUBLIC_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ apiBaseUrl });
});

export default router;
