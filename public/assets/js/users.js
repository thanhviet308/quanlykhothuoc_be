const API_BASE = window.API_BASE_URL || "/api";
const EP = {
    me: () => `${API_BASE}/auth/me`,
    logout: () => `${API_BASE}/auth/logout`,
    list: (q, page, limit, role, active) => {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (page) p.set("page", page);
        if (limit) p.set("limit", limit);
        if (role) p.set("role", role);
        if (active === "1" || active === "0") p.set("active", active);
        return `${API_BASE}/users?${p.toString()}`;
    },
    create: () => `${API_BASE}/users`,
    update: (id) => `${API_BASE}/users/${id}`,
    remove: (id) => `${API_BASE}/users/${id}`,
    setActive: (id) => `${API_BASE}/users/${id}/active`,
    detail: (id) => `${API_BASE}/users/${id}`,
};

const getToken = () => localStorage.getItem("token");
function authHeaders() {
    const t = getToken();
    return t ? { Authorization: "Bearer " + t } : {};
}

// ==== State ====
let page = 1, pages = 1, limit = 20;
let q = "", roleFilter = "", activeFilter = "";

// ==== Functions ====
async function checkMe() {
    try {
        const r = await fetch(EP.me(), { headers: authHeaders() });
        const payload = await r.json();
        const me = payload.user || payload; // backend trả {user:{...}}
        document.getElementById("me_info").textContent = `${me.username} (${me.role})`;
        if ((me.role || "").toUpperCase() !== "ADMIN") {
            alert("Bạn không có quyền vào trang quản trị!");
            location.href = "/";
        }
    } catch {
        location.href = "/login.html";
    }
}

async function logout() {
    await fetch(EP.logout(), { method: "POST", headers: authHeaders() });
    localStorage.removeItem("token");
    location.href = "/admin/login.html";
}

async function loadUsers(p = 1) {
    page = p;
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = `<tr><td colspan="7" class="muted">Đang tải...</td></tr>`;
    try {
        const url = EP.list(q, page, limit, roleFilter, activeFilter);
        const res = await fetch(url, { headers: authHeaders() });
        const json = await res.json();
        const rows = json.data || [];
        pages = json.pages;
        document.getElementById("page_info").textContent = `Trang ${page}/${pages}`;
        document.getElementById("count_info").textContent = `${json.total} kết quả`;

        tbody.innerHTML = rows.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.ho_ten || ""}</td>
        <td>${u.email || ""}</td>
        <td>${u.role}</td>
        <td>
          <span class="pill ${u.hoat_dong ? "active" : "inactive"}">
            ${u.hoat_dong ? "Đang hoạt động" : "Ngừng hoạt động"}
          </span>
        </td>
        <td>
          <button class="ok" onclick="editUser(${u.id})">Sửa</button>
          <button class="warn" onclick="toggleActive(${u.id}, ${!u.hoat_dong})">
            ${u.hoat_dong ? "Khóa" : "Mở khóa"}
          </button>
          <button class="danger" onclick="deleteUser(${u.id})">Xóa</button>
        </td>
      </tr>
    `).join("");
    } catch {
        tbody.innerHTML = `<tr><td colspan="7" class="muted">Lỗi tải danh sách</td></tr>`;
    }
}

async function saveUser() {
    const payload = {
        username: f_username.value.trim(),
        ho_ten: f_ho_ten.value.trim(),
        email: f_email.value.trim(),
        role: f_role.value,
        hoat_dong: f_hoat_dong.value === "1",
    };
    if (f_password.value) payload.password = f_password.value;

    const id = f_username.dataset.id;
    const url = id ? EP.update(id) : EP.create();
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message || "Lỗi lưu");
    closeModal();
    loadUsers();
}

function editUser(id) {
    fetch(EP.detail(id), { headers: authHeaders() })
        .then(r => r.json())
        .then(u => {
            showModal(u);
        });
}

async function deleteUser(id) {
    if (!confirm("Bạn chắc muốn xóa người dùng này?")) return;
    const res = await fetch(EP.remove(id), {
        method: "DELETE",
        headers: authHeaders(),
    });
    if (res.ok) loadUsers();
}

async function toggleActive(id, active) {
    await fetch(EP.setActive(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ active }),
    });
    loadUsers(page);
}

// ==== Modal ====
function showModal(u = null) {
    const bk = document.getElementById("modal_bk");
    bk.style.display = "flex";
    if (u) {
        f_username.value = u.username;
        f_username.dataset.id = u.id;
        f_ho_ten.value = u.ho_ten || "";
        f_email.value = u.email || "";
        f_role.value = u.role;
        f_hoat_dong.value = u.hoat_dong ? "1" : "0";
    } else {
        f_username.value = "";
        f_username.dataset.id = "";
        f_ho_ten.value = "";
        f_email.value = "";
        f_password.value = "";
        f_role.value = "STAFF";
        f_hoat_dong.value = "1";
    }
}
function closeModal() {
    document.getElementById("modal_bk").style.display = "none";
}

// ==== Event ====
document.getElementById("btn_logout").onclick = logout;
document.getElementById("btn_new").onclick = () => showModal();
document.getElementById("btn_cancel").onclick = closeModal;
document.getElementById("btn_save").onclick = saveUser;
document.getElementById("btn_search").onclick = () => {
    q = document.getElementById("q").value.trim();
    roleFilter = document.getElementById("roleFilter").value;
    activeFilter = document.getElementById("activeFilter").value;
    loadUsers(1);
};
document.getElementById("prev").onclick = () => { if (page > 1) loadUsers(page - 1); };
document.getElementById("next").onclick = () => { if (page < pages) loadUsers(page + 1); };

// ==== Init ====
checkMe();
loadUsers();
