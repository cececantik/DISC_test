// admin-auth.js
// Helper autentikasi dipakai bareng di semua halaman admin
// (admin.html, admin-detail.html). WAJIB di-include SEBELUM script utama
// halaman, dan WAJIB ada file ini di folder yang sama dengan html-nya.

const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USERNAME_KEY = "admin_username";

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function getAdminUsername() {
  return localStorage.getItem(ADMIN_USERNAME_KEY);
}

function saveAdminSession(token, username) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USERNAME_KEY, username);
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USERNAME_KEY);
}

// Panggil ini di paling awal tiap halaman admin (SELAIN admin-login.html) -
// kalau belum ada token tersimpan, langsung tendang ke halaman login
// sebelum sempat coba fetch data apapun.
function requireAdminAuth() {
  if (!getAdminToken()) {
    window.location.href = "admin-login.html";
  }
}

// Pengganti fetch() biasa, KHUSUS buat endpoint /api/admin/* yang perlu
// token. Otomatis nyisipin header Authorization, dan otomatis tendang ke
// halaman login kalau ternyata tokennya udah invalid/expired (server
// balikin 401).
async function adminFetch(url, options = {}) {
  const token = getAdminToken();
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    clearAdminSession();
    window.location.href = "admin-login.html";
    // Lempar error biar kode yang manggil (di halaman admin.html/
    // admin-detail.html) berhenti, nggak lanjut coba baca response
    // yang sebenarnya nggak akan dipakai (karena udah pindah halaman).
    throw new Error("Sesi login habis, dialihkan ke halaman login.");
  }

  return res;
}

function adminLogout() {
  clearAdminSession();
  window.location.href = "admin-login.html";
}