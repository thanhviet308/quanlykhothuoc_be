import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const LoaiThuoc = sequelize.define('LoaiThuoc', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ma: { type: DataTypes.STRING, allowNull: false },
    ten: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'loai_thuoc',
    underscored: true,
    timestamps: false
});

export default LoaiThuoc;
