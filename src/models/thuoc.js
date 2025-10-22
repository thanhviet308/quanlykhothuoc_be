import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Thuoc = sequelize.define('Thuoc', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ma_thuoc: { type: DataTypes.STRING, allowNull: false },
    ten_thuoc: { type: DataTypes.STRING, allowNull: false },
    loai_id: { type: DataTypes.INTEGER, allowNull: true },
    dvt_id: { type: DataTypes.INTEGER, allowNull: true },
    nguong_canh_bao: { type: DataTypes.INTEGER, allowNull: true },
    hoat_dong: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true }
}, {
    tableName: 'thuoc',
    underscored: true,
    timestamps: true
});

export default Thuoc;
