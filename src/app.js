import express from 'express'
import { testConnection } from './config/database.js'
import './models/index.js'
import dotenv from 'dotenv'
dotenv.config();
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Kiểm tra kết nối DB khi khởi động ứng dụng
testConnection()
const app = express();

app.use(express.json());

import authRoutes from './routes/authRoutes.js';
import thuocRoutes from './routes/thuocRoutes.js';
import phieuKhoRoutes from './routes/phieuKhoRoutes.js';
import configRoutes from './routes/configRoutes.js';
import userRoutes from './routes/usersRoutes.js';

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/thuoc', thuocRoutes);
app.use('/api/phieu-kho', phieuKhoRoutes);
app.use('/api', configRoutes); // exposes GET /api/config

app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

app.get("/", (_req, res) => {
    res.redirect("/admin/register.html");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await testConnection();
    console.log(`Server is running at: http://localhost:${PORT}`);
});
