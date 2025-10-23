import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

export const sequelize = new Sequelize(
    process.env.DB_NAME,   // tên database
    process.env.DB_USER,   // user
    process.env.DB_PASS,   // password
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        logging: false,      // bật true nếu muốn xem log SQL
    }
);

// Hàm kiểm tra kết nối
export async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log("Kết nối PostgreSQL thành công!");
        await sequelize.sync({ alter: true });
    } catch (err) {
        console.error("Lỗi kết nối CSDL:", err.message);
    }
}
