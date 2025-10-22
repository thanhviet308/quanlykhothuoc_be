// Khớp controller: POST /api/auth/register
// Body: { username, password, ho_ten, email } (+ role: nếu bạn muốn)
// Response: { id, username, role }
const API_BASE = "/api";

const els = {
    user: document.getElementById("regUser"),
    name: document.getElementById("regName"),
    email: document.getElementById("regEmail"),
    pwd: document.getElementById("regPwd"),
    role: document.getElementById("regRole"),
    btn: document.getElementById("btnRegister"),
    msg: document.getElementById("regMsg"),
};

function setMsg(t) { els.msg.textContent = t || ""; }

async function register() {
    setMsg("Đang tạo tài khoản...");
    const payload = {
        username: (els.user.value || "").trim(),
        password: els.pwd.value || "",
        ho_ten: (els.name.value || "").trim(),
        email: (els.email.value || "").trim(),
        // Controller hiện đang set mặc định role='STAFF', 
        // nếu muốn ghi đè role thì bạn có thể thêm vào body:
        role: (els.role.value || "STAFF"),
    };

    if (!payload.username || !payload.password) {
        setMsg("Cần username và mật khẩu");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            setMsg(data.message || "Đăng ký thất bại");
            return;
        }

        setMsg("Tạo tài khoản thành công. Chuyển đến đăng nhập…");
        setTimeout(() => window.location.href = "/admin/login", 700);
    } catch (e) {
        setMsg("Lỗi mạng khi đăng ký");
    }
}

els.btn.addEventListener("click", register);
document.addEventListener("keydown", (e) => { if (e.key === "Enter") register(); });
