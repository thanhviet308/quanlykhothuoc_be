import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const LoThuoc = sequelize.define('LoThuoc', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    thuoc_id: { type: DataTypes.INTEGER, allowNull: false },
    so_lo: { type: DataTypes.STRING, allowNull: false },
    han_dung: { type: DataTypes.DATE, allowNull: true },
    so_luong: { type: DataTypes.INTEGER, allowNull: true },
    trang_thai: { type: DataTypes.STRING, allowNull: true },
    gia_nhap: { type: DataTypes.DECIMAL(18, 2), allowNull: true }
}, {
    tableName: 'lo_thuoc',
    underscored: true,
    timestamps: true
});

export default LoThuoc;
