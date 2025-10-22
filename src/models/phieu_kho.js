import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const PhieuKho = sequelize.define('PhieuKho', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    so_phieu: { type: DataTypes.STRING, allowNull: false },
    loai: { type: DataTypes.STRING, allowNull: true },
    ngay_phieu: { type: DataTypes.DATE, allowNull: true },
    ghi_chu: { type: DataTypes.TEXT, allowNull: true },
    nguoi_lap_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
    tableName: 'phieu_kho',
    underscored: true,
    timestamps: true
});

export default PhieuKho;
