import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const DonViTinh = sequelize.define('DonViTinh', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ma: { type: DataTypes.STRING, allowNull: false },
    ten: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'don_vi_tinh',
    underscored: true,
    timestamps: false
});

export default DonViTinh;
