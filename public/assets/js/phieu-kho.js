// public/assets/js/phieu-kho.js
const API_BASE = window.API_BASE_URL || "/api";
const EP = {
    me: () => `${API_BASE}/auth/me`,
    logout: () => `${API_BASE}/auth/logout`,
    // Routes Phiếu Kho
    list: (q, page, limit, loai) => {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (page) p.set("page", page);
        if (limit) p.set("limit", limit);
        if (loai) p.set("loai", loai);
        return `${API_BASE}/phieu-kho?${p.toString()}`;
    },
    detail: (id) => `${API_BASE}/phieu-kho/${id}`,
    nhap: () => `${API_BASE}/phieu-kho/nhap`,
    xuat: () => `${API_BASE}/phieu-kho/xuat`,
    // 💡 ROUTE CẬP NHẬT
    update: (id) => `${API_BASE}/phieu-kho/${id}`,
    remove: (id) => `${API_BASE}/phieu-kho/${id}`,
    updateDetails: (id) => `${API_BASE}/phieu-kho/${id}/details`,
    // Routes tham chiếu (cần cho form tạo)
    listThuoc: (q) => {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        p.set("limit", 10);
        return `${API_BASE}/thuoc?${p.toString()}`;
    },
};

const getToken = () => localStorage.getItem("token");
function authHeaders() {
    const t = getToken();
    return t ? { Authorization: "Bearer " + t, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

// ==== State ====
let page = 1, pages = 1, limit = 20;
let q = "", loaiFilter = "";
let loaiPhieu = ''; // 'NHAP' hoặc 'XUAT' - Loại phiếu đang được tạo trong modal
let selectedItems = [];
let currentThuoc = null;
let currentPhieuId = null; // 💡 Biến state cho chế độ SỬA
let originalDetailIds = []; // 💡 Lưu các id chi tiết ban đầu để tính xóa

// ==== Modal Elements ====
const modal_bk = document.getElementById("modal_bk");
const f_so_phieu = document.getElementById("f_so_phieu");
const f_ngay_phieu = document.getElementById("f_ngay_phieu");
const f_ghi_chu = document.getElementById("f_ghi_chu");
const search_thuoc = document.getElementById("search_thuoc");
const thuoc_info = document.getElementById("thuoc_info");
const form_msg = document.getElementById("form_msg");

// Item Form Elements
const item_form_wrap = document.getElementById("item_form_wrap");
const f_so_luong = document.getElementById("f_so_luong");
const f_don_gia = document.getElementById("f_don_gia");
const lo_input_nhap = document.getElementById("lo_input_nhap");
const xuat_warning = document.getElementById("xuat_warning");
const f_so_lo = document.getElementById("f_so_lo");
const f_han_dung = document.getElementById("f_han_dung");
const f_lo_id_nhap = document.getElementById("f_lo_id_nhap");
const chi_tiet_form_wrap = document.getElementById("chi_tiet_form_wrap");

// Detail Table Elements
const detail_form_tbody = document.getElementById("detail_form_tbody");

// ==== Utility Functions ====

function setFormMsg(t) { if (form_msg) form_msg.textContent = t || ""; }
function closeModal() { if (modal_bk) modal_bk.style.display = "none"; }
function viewDetail(id) { window.location.href = `/admin/phieu-kho-detail.html?id=${id}`; }

async function checkMe() {
    try {
        const r = await fetch(EP.me(), { headers: authHeaders() });
        if (!r.ok) throw new Error('unauthorized');
        const payload = await r.json();
        const me = payload.user || payload;
        document.getElementById("me_info").textContent = `${me.username} (${roleLabel(me.role)})`;

        // Lấy role người dùng hiện tại
        window.USER_ROLE = (me.role || "").toUpperCase();

        if (!me.role) {
            alert("Bạn không có quyền truy cập!");
            location.href = "/";
        }
        if (document.body.id === "phieu-kho-list-page") loadPhieu();
        if (document.body.id === "phieu-kho-detail-page") loadPhieuDetail();
        if (document.body.id === "phieu-kho-form-page") initFormPage();
    } catch {
        location.href = "/admin/login.html";
    }
}

function roleLabel(role) {
    if (!role) return '';
    const r = (role || '').toString().toUpperCase();
    if (r === 'ADMIN') return 'Quản trị viên';
    if (r === 'STAFF') return 'Nhân viên kho';
    return role;
}

// Load phiếu detail page content
async function loadPhieuDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const wrap = document.getElementById('detail_wrap');
    const tbody = document.getElementById('detail_tbody');

    if (!id) {
        if (wrap) wrap.innerHTML = '<div class="card muted">Không có ID phiếu.</div>';
        return;
    }

    try {
        const res = await fetch(EP.detail(id), { headers: authHeaders() });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Lỗi tải chi tiết phiếu');
        }
        const data = await res.json();

        // Fill header info
        document.getElementById('p_so_phieu').textContent = data.so_phieu || '-';
        document.getElementById('p_loai').textContent = data.loai || '-';
        document.getElementById('p_ngay_phieu').textContent = data.ngay_phieu || (data.ngay_phieu_iso || '-');
        document.getElementById('p_nguoi_lap').textContent = data.nguoi_lap || '-';
        document.getElementById('p_ghi_chu').textContent = data.ghi_chu || '-';

        // Render details
        const items = data.chi_tiets || [];
        if (!tbody) return;
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="muted">Không có chi tiết.</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(it => {
            const so_lo = it.so_lo || (it.lo_id ? `ID:${it.lo_id}` : '-');
            const han_dung = it.han_dung || '-';
            const so_luong = it.so_luong != null ? it.so_luong : '-';
            const don_gia = (it.don_gia != null) ? parseFloat(it.don_gia).toFixed(2) : '-';
            const ma = it.ma_thuoc || (it.thuoc && it.thuoc.ma_thuoc) || '-';
            const ten = it.ten_thuoc || (it.thuoc && it.thuoc.ten_thuoc) || '-';

            return `
                <tr>
                    <td>${ma}</td>
                    <td>${ten}</td>
                    <td>${so_lo}</td>
                    <td>${han_dung}</td>
                    <td>${so_luong}</td>
                    <td>${don_gia}</td>
                </tr>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        if (wrap) wrap.innerHTML = `<div class="card muted">Lỗi: ${e.message}</div>`;
    }
}

async function logout() {
    await fetch(EP.logout(), { method: "POST", headers: authHeaders() });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    location.href = "/admin/login.html";
}

// ==== Core Functions - Form Page Init ====
function initFormPage() {
    // Xác định loại phiếu từ query (?loai=NHAP|XUAT), mặc định NHAP
    const params = new URLSearchParams(window.location.search);
    loaiPhieu = (params.get('loai') || 'NHAP').toUpperCase();

    // Cập nhật chip hiển thị loại phiếu
    const pLoai = document.getElementById('p_loai');
    if (pLoai) pLoai.textContent = (loaiPhieu === 'XUAT') ? 'Xuất Kho' : 'Nhập Kho';

    // Khởi tạo số phiếu và ngày phiếu nếu trống
    if (f_so_phieu && !f_so_phieu.value) {
        f_so_phieu.value = `PK${loaiPhieu}/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    }
    if (f_ngay_phieu && !f_ngay_phieu.value) {
        f_ngay_phieu.value = new Date().toISOString().split('T')[0];
    }

    // Hiển thị/ẩn input lô và cảnh báo theo loại phiếu
    if (loaiPhieu === 'NHAP') {
        if (lo_input_nhap) lo_input_nhap.classList.remove('hidden');
        if (xuat_warning) xuat_warning.classList.add('hidden');
    } else {
        if (lo_input_nhap) lo_input_nhap.classList.add('hidden');
        if (xuat_warning) xuat_warning.classList.remove('hidden');
    }

    // Gán sự kiện cho form chi tiết
    const addBtn = document.getElementById('add_item_btn');
    if (addBtn) addBtn.onclick = addItemToDetails;

    if (search_thuoc) {
        search_thuoc.addEventListener('input', () => {
            // Tự động tìm theo nội dung nhập, hàm tự kiểm tra độ dài
            searchThuoc();
        });
        search_thuoc.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchThuoc();
            }
        });
    }

    // Reset state và render bảng rỗng
    selectedItems = [];
    renderPhieuDetails();
}


// ==== Core Functions - List Page ====

async function loadPhieu(p = 1) {
    page = p;
    const q = document.getElementById("q").value.trim();
    loaiFilter = document.getElementById("loaiFilter")?.value || "";

    const tbody = document.getElementById("tbody");
    tbody.innerHTML = `<tr><td colspan="6" class="muted">Đang tải...</td></tr>`;

    try {
        const url = EP.list(q, page, limit, loaiFilter);
        const res = await fetch(url, { headers: authHeaders() });
        const json = await res.json();
        const rows = json.data || [];
        pages = json.pages;
        const total = json.total;

        document.getElementById("page_info").textContent = `Trang ${page}/${pages}`;
        document.getElementById("count_info").textContent = `${total} kết quả (${limit} mỗi trang)`;

        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="muted">Không tìm thấy phiếu kho nào.</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(p => {
            const isNhap = p.loai === 'NHAP';
            const loaiText = isNhap ? "Nhập Kho" : (p.loai === 'XUAT' ? "Xuất Kho" : p.loai);
            const loaiClass = isNhap ? "ok" : (p.loai === 'XUAT' ? "danger" : "muted");

            const isAdmin = window.USER_ROLE === 'ADMIN';
            const actions = isAdmin
                ? `<button class="danger" onclick="event.stopPropagation(); deletePhieu(${p.id}, '${p.so_phieu}')">Xóa</button>`
                : `<span class="muted">—</span>`;

            return `
                <tr onclick="viewDetail(${p.id})" style="cursor:pointer">
                    <td>${p.id}</td>
                    <td>${p.so_phieu}</td>
                    <td><span class="pill ${loaiClass}">${loaiText}</span></td>
                    <td>${p.ngay_phieu}</td>
                    <td>${p.nguoi_lap}</td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join("");

        document.getElementById("prev").disabled = page <= 1;
        document.getElementById("next").disabled = page >= pages;

    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="6" class="muted">Lỗi tải danh sách phiếu</td></tr>`;
    }
}

// ==== Core Functions - Delete (Hoàn tác tồn kho) ====

async function deletePhieu(id, so_phieu) {
    if (window.USER_ROLE !== 'ADMIN') {
        alert("Bạn không có quyền xóa phiếu kho.");
        return;
    }
    if (!confirm(`Bạn chắc chắn muốn xóa Phiếu ${so_phieu} (ID: ${id})? Thao tác này sẽ đảo ngược tồn kho! (Chỉ ADMIN thực hiện)`)) return;

    try {
        const res = await fetch(EP.remove(id), {
            method: "DELETE",
            headers: authHeaders(),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return alert(`Lỗi xóa phiếu: ${data.message || res.statusText}`);
        }

        alert(`Xóa Phiếu ${so_phieu} thành công và đã đảo ngược tồn kho.`);
        loadPhieu(page);
    } catch (e) {
        alert("Lỗi mạng khi xóa phiếu.");
    }
}

// ==== Core Functions - Modal Form (Tạo & Sửa) ====

function resetModal(loai, phieuData = null) {
    currentPhieuId = phieuData ? phieuData.id : null;
    loaiPhieu = loai;
    selectedItems = [];
    currentThuoc = null;
    setFormMsg("");

    // 1. Cập nhật tiêu đề và loại phiếu
    const titleEl = document.getElementById("modal_title");
    if (titleEl) titleEl.textContent = phieuData ? `Sửa Phiếu ${phieuData.so_phieu}` : (loai === 'NHAP' ? 'Tạo Phiếu Nhập Kho Mới' : 'Tạo Phiếu Xuất Kho Mới');
    const loaiEl = document.getElementById("loai_phieu_display");
    if (loaiEl) loaiEl.textContent = loai;

    // 2. Điền dữ liệu
    if (f_so_phieu && f_ngay_phieu && f_ghi_chu) {
        if (phieuData) {
            f_so_phieu.value = phieuData.so_phieu;
            f_ngay_phieu.value = phieuData.ngay_phieu_iso; // YYYY-MM-DD
            f_ghi_chu.value = phieuData.ghi_chu || "";
        } else {
            f_so_phieu.value = `PK${loai}/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
            f_ngay_phieu.value = new Date().toISOString().split('T')[0];
            f_ghi_chu.value = "";
        }
    }

    // 3. Cấu hình chế độ
    const isEdit = currentPhieuId !== null;
    const isNhap = loai === 'NHAP';
    const btn_save = document.getElementById('btn_save');

    if (isEdit) {
        // Chế độ SỬA (chỉ cho phép sửa thông tin chung)
        const subEl = document.getElementById('modal_subtitle');
        if (btn_save) btn_save.textContent = "Lưu Cập Nhật";

        // Cho phép SỬA CHI TIẾT đối với NHẬP
        if (loai === 'NHAP') {
            if (chi_tiet_form_wrap) chi_tiet_form_wrap.classList.remove('hidden');
            if (subEl) subEl.textContent = "Bạn có thể sửa số lượng/đơn giá và xóa dòng (phiếu NHẬP).";
        } else {
            if (chi_tiet_form_wrap) chi_tiet_form_wrap.classList.add('hidden');
            if (subEl) subEl.textContent = "Chỉ cập nhật thông tin chung. Chi tiết phiếu không thể thay đổi cho phiếu XUẤT.";
        }

    } else {
        // Chế độ TẠO MỚI
        if (chi_tiet_form_wrap) chi_tiet_form_wrap.classList.remove('hidden');
        const subEl = document.getElementById('modal_subtitle');
        if (subEl) subEl.textContent = "Vui lòng thêm chi tiết thuốc cho phiếu mới.";
        if (btn_save) btn_save.textContent = "Lưu Phiếu";

        // Cấu hình form thêm chi tiết theo loại phiếu
        if (isNhap) {
            if (lo_input_nhap) lo_input_nhap.classList.remove('hidden');
            if (xuat_warning) xuat_warning.classList.add('hidden');
        } else { // XUAT
            if (lo_input_nhap) lo_input_nhap.classList.add('hidden');
            if (xuat_warning) xuat_warning.classList.remove('hidden');
        }
    }

    // Reset Form chi tiết item
    if (search_thuoc) search_thuoc.value = "";
    const searchResultsEl = document.getElementById('thuoc_search_results');
    if (searchResultsEl) searchResultsEl.innerHTML = '';
    if (thuoc_info) thuoc_info.textContent = 'Chưa chọn thuốc';
    if (item_form_wrap) item_form_wrap.classList.add('hidden');
    if (f_so_luong) f_so_luong.value = '1';
    if (f_don_gia) f_don_gia.value = '0';
    if (f_so_lo) f_so_lo.value = '';
    if (f_han_dung) f_han_dung.value = '';
    if (f_lo_id_nhap) f_lo_id_nhap.value = '';

    // Render danh sách trống (chỉ cần ở chế độ tạo)
    if (typeof renderPhieuDetails === 'function') renderPhieuDetails();

    if (modal_bk) modal_bk.style.display = "flex";
}

// Hàm mở modal ở chế độ TẠO MỚI
function showPhieuModal(loai) {
    resetModal(loai, null);
}

// Hàm mở modal ở chế độ SỬA THÔNG TIN CHUNG
async function editPhieu(id) {
    if (window.USER_ROLE !== 'ADMIN') {
        alert("Bạn không có quyền sửa phiếu kho.");
        return;
    }
    try {
        const res = await fetch(EP.detail(id), { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) return alert(data.message || "Lỗi tải chi tiết phiếu để sửa.");

        // Chuyển ngày tháng từ DD/MM/YYYY sang YYYY-MM-DD
        const ngay_phieu_parts = data.ngay_phieu.split('/');
        const ngay_phieu_iso = ngay_phieu_parts.length === 3 ? `${ngay_phieu_parts[2]}-${ngay_phieu_parts[1]}-${ngay_phieu_parts[0]}` : '';

        data.ngay_phieu_iso = ngay_phieu_iso;

        // Nạp chi tiết vào selectedItems để cho phép sửa đối với NHẬP
        selectedItems = (data.chi_tiets || []).map(ct => ({
            id: ct.id,
            lo_id: ct.lo_id,
            ma_thuoc: ct.ma_thuoc,
            ten_thuoc: ct.ten_thuoc,
            so_lo: ct.so_lo,
            han_dung: ct.han_dung,
            so_luong: Math.max(1, parseInt(ct.so_luong, 10) || 1),
            don_gia: parseFloat(ct.don_gia) || 0,
        }));
        originalDetailIds = selectedItems.filter(x => x.id).map(x => x.id);

        resetModal(data.loai, data);
        renderPhieuDetails();

    } catch (e) {
        alert("Lỗi mạng khi tải chi tiết phiếu.");
    }
}

async function searchThuoc() {
    const q = search_thuoc.value.trim();
    const resultEl = document.getElementById('thuoc_search_results');
    resultEl.innerHTML = '';
    if (q.length < 2) return;

    try {
        const res = await fetch(EP.listThuoc(q), { headers: authHeaders() });
        const items = await res.json();

        resultEl.innerHTML = items.map(t => `
            <li onclick="selectThuoc(${t.id}, '${t.ma_thuoc}', '${t.ten_thuoc}')">
                [${t.ma_thuoc}] ${t.ten_thuoc}
            </li>
        `).join('');
    } catch (e) {
        console.error(e);
        resultEl.innerHTML = `<li>Lỗi tìm kiếm thuốc.</li>`;
    }
}

function selectThuoc(id, ma_thuoc, ten_thuoc) {
    currentThuoc = { id, ma_thuoc, ten_thuoc };
    thuoc_info.textContent = `Đã chọn: [${ma_thuoc}] ${ten_thuoc}`;
    document.getElementById('thuoc_search_results').innerHTML = '';
    item_form_wrap.classList.remove('hidden');
}

function addItemToDetails() {
    // Chỉ cho phép thêm chi tiết ở chế độ TẠO MỚI
    if (currentPhieuId !== null) return;

    setFormMsg('');
    if (!currentThuoc) {
        setFormMsg("Vui lòng chọn thuốc trước.");
        return;
    }

    const so_luong_val = parseInt(f_so_luong.value);
    const don_gia_val = parseFloat(f_don_gia.value) || 0;

    if (!so_luong_val || so_luong_val <= 0) {
        setFormMsg("Số lượng phải lớn hơn 0.");
        return;
    }

    const item = {
        thuoc_id: currentThuoc.id,
        ma_thuoc: currentThuoc.ma_thuoc,
        ten_thuoc: currentThuoc.ten_thuoc,
        so_luong: so_luong_val,
        don_gia: don_gia_val,
    };

    if (loaiPhieu === 'NHAP') {
        const so_lo_val = f_so_lo.value.trim();
        const han_dung_val = f_han_dung.value;
        const lo_id_val = f_lo_id_nhap.value;

        // Validation cho Phiếu NHẬP: Cần có (Lô Mới + Hạn Dùng) HOẶC ID Lô cũ
        if (!lo_id_val && (!so_lo_val || !han_dung_val)) {
            setFormMsg("Phiếu Nhập phải có Số Lô & Hạn Dùng (cho lô mới) HOẶC ID Lô cũ.");
            return;
        }

        item.so_lo = so_lo_val || null;
        item.han_dung = han_dung_val || null;
        item.lo_id = lo_id_val ? parseInt(lo_id_val) : null;
    }

    selectedItems.push(item);
    renderPhieuDetails();

    // Reset Form item
    currentThuoc = null;
    search_thuoc.value = '';
    thuoc_info.textContent = 'Chưa chọn thuốc';
    item_form_wrap.classList.add('hidden');
    f_so_luong.value = '1';
    f_don_gia.value = '0';
    f_so_lo.value = '';
    f_han_dung.value = '';
    f_lo_id_nhap.value = '';
}

function renderPhieuDetails() {
    if (!detail_form_tbody) return;
    if (selectedItems.length === 0) {
        detail_form_tbody.innerHTML = `<tr><td colspan="6" class="muted">Chưa có chi tiết phiếu.</td></tr>`;
        return;
    }

    detail_form_tbody.innerHTML = selectedItems.map((item, index) => {
        const lo_hsd = item.lo_id
            ? `ID Lô: ${item.lo_id}`
            : `${item.so_lo || 'Mới/N/A'} / ${item.han_dung || 'N/A'}`;

        return `
            <tr>
                <td>${index + 1}</td>
                <td>[${item.ma_thuoc}] ${item.ten_thuoc}</td>
                <td>${lo_hsd}</td>
                <td><input type="number" min="1" value="${item.so_luong}" onchange="updateItemQty(${index}, this.value)" style="width:100%"/></td>
                <td><input type="number" step="0.01" value="${item.don_gia}" onchange="updateItemPrice(${index}, this.value)" style="width:100%"/></td>
                <td><button class="danger" onclick="removeItem(${index})">Xóa</button></td>
            </tr>
        `;
    }).join('');
}

function removeItem(index) {
    // Cho phép xóa khi tạo mới, hoặc khi sửa NHẬP
    if (currentPhieuId !== null && loaiPhieu !== 'NHAP') return;
    selectedItems.splice(index, 1);
    renderPhieuDetails();
}

function updateItemQty(index, val) {
    const v = Math.max(1, parseInt(val, 10) || 1);
    selectedItems[index].so_luong = v;
}

function updateItemPrice(index, val) {
    const v = parseFloat(val) || 0;
    selectedItems[index].don_gia = v;
}

async function submitPhieu() {
    setFormMsg("Đang lưu...");

    const so_phieu = f_so_phieu.value.trim();
    const ngay_phieu = f_ngay_phieu.value;
    const ghi_chu = f_ghi_chu.value.trim();

    if (!so_phieu || !ngay_phieu) {
        setFormMsg("Số phiếu và Ngày phiếu là bắt buộc.");
        return;
    }

    const payload = { so_phieu, ngay_phieu, ghi_chu };
    let url, method;

    if (currentPhieuId) {
        // CHẾ ĐỘ SỬA
        if (window.USER_ROLE !== 'ADMIN') return setFormMsg("Chỉ ADMIN được cập nhật.");
        if (loaiPhieu === 'NHAP') {
            // Gửi cập nhật header trước
            const resHeader = await fetch(EP.update(currentPhieuId), {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });
            const dataHeader = await resHeader.json().catch(() => ({}));
            if (!resHeader.ok) {
                setFormMsg(`Lỗi cập nhật phiếu: ${dataHeader.message || resHeader.statusText}`);
                return;
            }
            // Sau đó cập nhật chi tiết
            const remainingIds = selectedItems.filter(x => x.id).map(x => x.id);
            const delete_ids = originalDetailIds.filter(id => !remainingIds.includes(id));
            const details = selectedItems.map(x => ({ id: x.id, lo_id: x.lo_id, so_luong: x.so_luong, don_gia: x.don_gia }));
            const resDetails = await fetch(EP.updateDetails(currentPhieuId), {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ details, delete_ids }),
            });
            const dataDetails = await resDetails.json().catch(() => ({}));
            if (!resDetails.ok) {
                setFormMsg(`Lỗi cập nhật chi tiết: ${dataDetails.message || resDetails.statusText}`);
                return;
            }
            alert('Cập nhật phiếu và chi tiết thành công.');
            closeModal();
            loadPhieu(page);
            return;
        } else {
            // XUẤT: chỉ cập nhật thông tin chung
            url = EP.update(currentPhieuId);
            method = 'PUT';
        }
    } else {
        // CHẾ ĐỘ TẠO MỚI (Thêm chi tiết)
        if (selectedItems.length === 0) {
            setFormMsg("Phiếu phải có ít nhất một chi tiết.");
            return;
        }

        const chi_tiets_payload = selectedItems.map(item => {
            const detailPayload = {
                thuoc_id: item.thuoc_id,
                so_luong: item.so_luong,
                don_gia: item.don_gia
            };
            if (loaiPhieu === 'NHAP') {
                detailPayload.so_lo = item.so_lo;
                detailPayload.han_dung = item.han_dung;
                detailPayload.lo_id = item.lo_id;
            }
            return detailPayload;
        });

        payload.loai = loaiPhieu;
        payload.chi_tiets = chi_tiets_payload;

        url = loaiPhieu === 'NHAP' ? EP.nhap() : EP.xuat();
        method = 'POST';
    }

    const btn = document.getElementById('btn_save');
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(url, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            setFormMsg(`Lỗi ${method === 'PUT' ? 'cập nhật' : 'tạo'} phiếu: ${data.message || res.statusText}`);
            return;
        }

        alert(`${method === 'PUT' ? 'Cập nhật' : 'Tạo'} Phiếu thành công! Số phiếu: ${so_phieu}`);
        closeModal();
        loadPhieu(1);

    } catch (e) {
        setFormMsg("Lỗi mạng.");
    } finally {
        if (btn) btn.disabled = false;
    }
}


// Gắn các hàm vào global window và Event Listeners
window.showPhieuModal = showPhieuModal;
window.deletePhieu = deletePhieu; // 💡 Gắn hàm xóa
window.selectThuoc = selectThuoc;
window.removeItem = removeItem;
window.updateItemQty = updateItemQty;
window.updateItemPrice = updateItemPrice;

// List page events
if (document.body.id === "phieu-kho-list-page") {
    const btnSearch = document.getElementById("btn_search");
    if (btnSearch) btnSearch.onclick = () => loadPhieu(1);
    const btnPrev = document.getElementById("prev");
    const btnNext = document.getElementById("next");
    if (btnPrev) btnPrev.onclick = () => { if (page > 1) loadPhieu(page - 1); };
    if (btnNext) btnNext.onclick = () => { if (page < pages) loadPhieu(page + 1); };

    // Không còn chức năng cập nhật, bỏ các handler modal
}

// Bắt sự kiện thoát (logout) chung
if (document.getElementById("btn_logout")) {
    document.getElementById("btn_logout").onclick = logout;
}

// Init
checkMe();