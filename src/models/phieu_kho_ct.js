import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const PhieuKhoCT = sequelize.define('PhieuKhoCT', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    phieu_id: { type: DataTypes.INTEGER, allowNull: false },
    thuoc_id: { type: DataTypes.INTEGER, allowNull: false },
    lo_id: { type: DataTypes.INTEGER, allowNull: true },
    so_luong: { type: DataTypes.INTEGER, allowNull: false },
    don_gia: { type: DataTypes.DECIMAL(18, 2), allowNull: true }
}, {
    tableName: 'phieu_kho_ct',
    underscored: true,
    timestamps: false
});

export default PhieuKhoCT;
