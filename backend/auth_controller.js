// auth_controller.js
// Login untuk admin: cek username + password ke tabel `admins`,
// kalau cocok, keluarin JWT token yang dipakai buat akses endpoint admin lainnya.

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db.js");

// PENTING: di production, JWT_SECRET ini HARUS diambil dari environment
// variable (misal file .env), bukan ditulis langsung di kode kayak gini.
// Untuk sekarang (development/tugas kuliah) ini cukup, tapi ganti
// stringnya jadi sesuatu yang acak & panjang punya kamu sendiri.
const JWT_SECRET = process.env.JWT_SECRET || "disc-test-secret-key-ganti-ini-ya-dengan-yang-lebih-acak";
const TOKEN_EXPIRY = "8h"; // token otomatis nggak valid lagi setelah 8 jam, admin harus login ulang

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username dan password wajib diisi.",
    });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM admins WHERE username = ?",
      [username],
    );

    if (rows.length === 0) {
      // Sengaja pesan errornya sama kayak 'password salah' (bukan 'username
      // tidak ditemukan') - biar orang luar nggak bisa nebak-nebak username
      // mana yang valid cuma dari beda pesan error.
      return res.status(401).json({
        success: false,
        message: "Username atau password salah.",
      });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah.",
      });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY },
    );

    res.json({
      success: true,
      token,
      username: admin.username,
    });
  } catch (error) {
    console.error("Error saat login admin:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memproses login.",
    });
  }
}

module.exports = { login, JWT_SECRET };