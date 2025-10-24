// public/assets/js/thuoc.js (Đã cập nhật)
const API_BASE = window.API_BASE_URL || "/api";
const EP = {
    me: () => `${API_BASE}/auth/me`,
    logout: () => `${API_BASE}/auth/logout`,
    list: (q, page, limit) => {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (page) p.set("offset", (page - 1) * limit);
        if (limit) p.set("limit", limit);
        return `${API_BASE}/thuoc?${p.toString()}`;
    },
    create: () => `${API_BASE}/thuoc`,
    update: (id) => `${API_BASE}/thuoc/${id}`,
    remove: (id) => `${API_BASE}/thuoc/${id}`,
    detail: (id) => `${API_BASE}/thuoc/${id}`,
    // API mới
    listDVT: () => `${API_BASE}/thuoc/don-vi-tinh`,
    listLoaiThuoc: () => `${API_BASE}/thuoc/loai-thuoc`,
};

const getToken = () => localStorage.getItem("token");
function authHeaders() {
    const t = getToken();
    return t ? { Authorization: "Bearer " + t } : {};
}

// ==== State ====
let page = 1, limit = 50;
let dvtList = []; // Lưu danh sách DVT
let loaiThuocList = []; // Lưu danh sách Loại Thuốc

// ==== Form elements for Modal ====
const f_ma_thuoc = document.getElementById("f_ma_thuoc");
const f_ten_thuoc = document.getElementById("f_ten_thuoc");
const f_loai_id = document.getElementById("f_loai_id"); // SELECT element
const f_dvt_id = document.getElementById("f_dvt_id");   // SELECT element
const f_nguong_canh_bao = document.getElementById("f_nguong_canh_bao");
const f_hoat_dong = document.getElementById("f_hoat_dong");
const form_msg = document.getElementById("form_msg");

// ==== Utility Functions ====

async function fetchAndPopulateDropdown(endpointFn, element, initialText) {
    try {
        const res = await fetch(endpointFn(), { headers: authHeaders() });
        const items = await res.json();
        const html = items.map(item => `<option value="${item.id}">${item.ten}</option>`).join("");
        element.innerHTML = `<option value="">${initialText}</option>` + html;
        return items;
    } catch (e) {
        console.error("Lỗi tải danh sách:", endpointFn.name, e);
        element.innerHTML = `<option value="">-- Lỗi tải dữ liệu --</option>`;
        return [];
    }
}

async function loadReferenceData() {
    // Tải danh sách DVT
    dvtList = await fetchAndPopulateDropdown(EP.listDVT, f_dvt_id, "-- Chọn đơn vị tính --");

    // Tải danh sách Loại Thuốc
    loaiThuocList = await fetchAndPopulateDropdown(EP.listLoaiThuoc, f_loai_id, "-- Chọn loại thuốc --");
}

// ==== Core Functions ====

async function checkMe() {
    try {
        const r = await fetch(EP.me(), { headers: authHeaders() });
        const payload = await r.json();
        const me = payload.user || payload;
        document.getElementById("me_info").textContent = `${me.username} (${roleLabel(me.role)})`;
        if ((me.role || "").toUpperCase() !== "ADMIN") {
            alert("Bạn không có quyền vào trang quản trị!");
            location.href = "/";
        }
        await loadReferenceData(); // Tải data tham chiếu sau khi xác thực
        loadThuoc(); // Gọi loadThuoc sau khi tải xong data tham chiếu
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

async function logout() {
    await fetch(EP.logout(), { method: "POST", headers: authHeaders() });
    localStorage.removeItem("token");
    location.href = "/admin/login.html";
}

async function loadThuoc(p = 1) {
    page = p;
    const q = document.getElementById("q").value.trim();
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = `<tr><td colspan="8" class="muted">Đang tải...</td></tr>`;

    // Hàm tìm tên từ ID trong danh sách tham chiếu
    const getTen = (id, list) => {
        const item = list.find(i => i.id === id);
        return item ? item.ten : `ID ${id}`;
    };

    try {
        const url = EP.list(q, page, limit);
        const res = await fetch(url, { headers: authHeaders() });
        const rows = await res.json();

        const rowsCount = rows.length;
        document.getElementById("count_info").textContent = `${rowsCount} kết quả (tối đa ${limit} mỗi trang)`;
        document.getElementById("page_info").textContent = `Trang ${page}`;

        if (rowsCount === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="muted">Không tìm thấy thuốc nào.</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${t.ma_thuoc}</td>
        <td>${t.ten_thuoc}</td>
        <td>${t.loai_id ? getTen(t.loai_id, loaiThuocList) : ""}</td>
        <td>${t.dvt_id ? getTen(t.dvt_id, dvtList) : ""}</td>
        <td>${t.nguong_canh_bao || 0}</td>
        <td>
          <span class="pill ${t.hoat_dong ? "active" : "inactive"}">
            ${t.hoat_dong ? "Hoạt động" : "Ngừng HĐ"}
          </span>
        </td>
        <td>
          <button class="ok" onclick="editThuoc(${t.id})">Sửa</button>
          <button class="danger" onclick="deleteThuoc(${t.id})">Xóa</button>
        </td>
      </tr>
    `).join("");
    } catch {
        tbody.innerHTML = `<tr><td colspan="8" class="muted">Lỗi tải danh sách</td></tr>`;
    }
}

function setFormMsg(t) { form_msg.textContent = t || ""; }

async function saveThuoc() {
    const id = f_ma_thuoc.dataset.id;
    const loai_id = f_loai_id.value;
    const dvt_id = f_dvt_id.value;

    const payload = {
        ma_thuoc: f_ma_thuoc.value.trim(),
        ten_thuoc: f_ten_thuoc.value.trim(),
        // Lấy giá trị từ SELECT
        loai_id: loai_id ? parseInt(loai_id) : null,
        dvt_id: dvt_id ? parseInt(dvt_id) : null,
        nguong_canh_bao: f_nguong_canh_bao.value ? parseInt(f_nguong_canh_bao.value) : 0,
        hoat_dong: f_hoat_dong.value === "1",
    };

    if (!payload.ma_thuoc || !payload.ten_thuoc) {
        return setFormMsg("Mã thuốc và Tên thuốc là bắt buộc!");
    }

    const url = id ? EP.update(id) : EP.create();
    const method = id ? "PUT" : "POST";

    setFormMsg("Đang lưu...");

    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return setFormMsg(data.message || "Lỗi lưu thuốc");
        }

        closeModal();
        loadThuoc(page);
    } catch (e) {
        setFormMsg("Lỗi mạng khi lưu");
    }
}

function editThuoc(id) {
    fetch(EP.detail(id), { headers: authHeaders() })
        .then(r => r.json())
        .then(t => {
            showModal(t);
        })
        .catch(e => {
            alert("Lỗi tải chi tiết thuốc: " + e.message);
        });
}

async function deleteThuoc(id) {
    if (!confirm("Bạn chắc muốn xóa thuốc này?")) return;
    try {
        const res = await fetch(EP.remove(id), {
            method: "DELETE",
            headers: authHeaders(),
        });
        if (res.ok) loadThuoc(page);
        else {
            const data = await res.json().catch(() => ({}));
            alert(data.message || "Lỗi xóa thuốc");
        }
    } catch (e) {
        alert("Lỗi mạng khi xóa");
    }
}

// ==== Modal ====
function showModal(t = null) {
    const bk = document.getElementById("modal_bk");
    bk.style.display = "flex";
    setFormMsg("");
    if (t) {
        document.getElementById("modal_title").textContent = `Sửa Thuốc: ${t.ten_thuoc}`;
        f_ma_thuoc.value = t.ma_thuoc || "";
        f_ma_thuoc.dataset.id = t.id;
        f_ten_thuoc.value = t.ten_thuoc || "";

        // Gán giá trị cho SELECT
        f_loai_id.value = t.loai_id || "";
        f_dvt_id.value = t.dvt_id || "";

        f_nguong_canh_bao.value = t.nguong_canh_bao || 0;
        f_hoat_dong.value = t.hoat_dong ? "1" : "0";
    } else {
        document.getElementById("modal_title").textContent = "Thêm Thuốc mới";
        f_ma_thuoc.value = "";
        f_ma_thuoc.dataset.id = "";
        f_ten_thuoc.value = "";

        // Reset SELECT
        f_loai_id.value = "";
        f_dvt_id.value = "";

        f_nguong_canh_bao.value = 0;
        f_hoat_dong.value = "1";
    }
}

function closeModal() {
    document.getElementById("modal_bk").style.display = "none";
}

// Gắn các hàm vào global window để HTML có thể gọi
window.editThuoc = editThuoc;
window.deleteThuoc = deleteThuoc;

// ==== Event ====
document.getElementById("btn_logout").onclick = logout;
document.getElementById("btn_new").onclick = () => showModal();
document.getElementById("btn_cancel").onclick = closeModal;
document.getElementById("btn_save").onclick = saveThuoc;

document.getElementById("btn_search").onclick = () => {
    loadThuoc(1);
};
document.getElementById("prev").onclick = () => { if (page > 1) loadThuoc(page - 1); };
document.getElementById("next").onclick = () => { loadThuoc(page + 1); };

// ==== Init ====
checkMe();