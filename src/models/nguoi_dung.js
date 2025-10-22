import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const NguoiDung = sequelize.define('NguoiDung', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false },
    mat_khau_bam: { type: DataTypes.STRING, allowNull: false },
    ho_ten: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.STRING, allowNull: true },
    hoat_dong: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true }
}, {
    tableName: 'nguoi_dung',
    underscored: true,
    timestamps: true
});

export default NguoiDung;
