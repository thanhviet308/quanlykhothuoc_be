import Thuoc from './thuoc.js';
import LoThuoc from './lo_thuoc.js';
import DonViTinh from './don_vi_tinh.js';
import LoaiThuoc from './loai_thuoc.js';
import PhieuKho from './phieu_kho.js';
import PhieuKhoCT from './phieu_kho_ct.js';
import NguoiDung from './nguoi_dung.js';

// Associations
Thuoc.belongsTo(LoaiThuoc, { foreignKey: 'loai_id', as: 'loai' });
Thuoc.belongsTo(DonViTinh, { foreignKey: 'dvt_id', as: 'don_vi_tinh' });
LoaiThuoc.hasMany(Thuoc, { foreignKey: 'loai_id', as: 'thuocs' });
DonViTinh.hasMany(Thuoc, { foreignKey: 'dvt_id', as: 'thuocs' });

LoThuoc.belongsTo(Thuoc, { foreignKey: 'thuoc_id', as: 'thuoc' });
Thuoc.hasMany(LoThuoc, { foreignKey: 'thuoc_id', as: 'lo_thuocs' });

PhieuKhoCT.belongsTo(PhieuKho, { foreignKey: 'phieu_id', as: 'phieu' });
PhieuKho.hasMany(PhieuKhoCT, { foreignKey: 'phieu_id', as: 'chi_tiets' });

PhieuKhoCT.belongsTo(Thuoc, { foreignKey: 'thuoc_id', as: 'thuoc' });
PhieuKhoCT.belongsTo(LoThuoc, { foreignKey: 'lo_id', as: 'lo_thuoc' });

PhieuKho.belongsTo(NguoiDung, { foreignKey: 'nguoi_lap_id', as: 'nguoi_lap' });
NguoiDung.hasMany(PhieuKho, { foreignKey: 'nguoi_lap_id', as: 'phieu_khos' });

export {
    Thuoc,
    LoThuoc,
    DonViTinh,
    LoaiThuoc,
    PhieuKho,
    PhieuKhoCT,
    NguoiDung
};
