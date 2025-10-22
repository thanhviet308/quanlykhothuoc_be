// Khớp controller: POST /api/auth/login {username, password}
// Response: { token, user: { id, username, ho_ten, role } }
const API_BASE = window.API_BASE_URL || "/api";

const els = {
    user: document.getElementById("loginUser"),
    pwd: document.getElementById("loginPwd"),
    btn: document.getElementById("btnLogin"),
    msg: document.getElementById("loginMsg"),
};

function setMsg(t) { els.msg.textContent = t || ""; }

async function login() {
    setMsg("Đang đăng nhập...");
    const payload = {
        username: (els.user.value || "").trim(),
        password: els.pwd.value || "",
    };
    if (!payload.username || !payload.password) {
        setMsg("Vui lòng nhập đủ username và mật khẩu");
        return;
    }

    try {
        els.btn.disabled = true;
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            setMsg(data.message || "Đăng nhập thất bại");
            return;
        }

        // Lưu token & user để các trang khác dùng
        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

        // Điều hướng theo role
        if ((data.user?.role || "").toUpperCase() === "ADMIN") {
            window.location.href = "/admin/users.html";
        } else {
            // nhân viên/staff -> trang chủ
            window.location.href = "/";
        }
    } catch (e) {
        setMsg("Lỗi mạng khi đăng nhập");
    } finally {
        els.btn.disabled = false;
    }
}

els.btn.addEventListener("click", login);
document.addEventListener("keydown", (e) => { if (e.key === "Enter") login(); });
