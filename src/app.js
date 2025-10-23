import express from 'express'
import { testConnection } from './config/database.js'
import './models/index.js'
import dotenv from 'dotenv'
dotenv.config();
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

import authRoutes from './routes/authRoutes.js';
import thuocRoutes from './routes/thuocRoutes.js';
import phieuKhoRoutes from './routes/phieuKhoRoutes.js';
import configRoutes from './routes/configRoutes.js';
import userRoutes from './routes/usersRoutes.js';

import loThuocRoutes from './routes/loThuocRoutes.js';
import tonKhoRoutes from './routes/tonKhoRoutes.js';


app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/thuoc', thuocRoutes);
app.use('/api/phieu-kho', phieuKhoRoutes);
// 💡 SỬ DỤNG ROUTE MỚI
app.use('/api/lo-thuoc', loThuocRoutes);
app.use('/api/ton-kho', tonKhoRoutes);
app.use('/api', configRoutes);

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