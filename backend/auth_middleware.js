// auth_middleware.js
// Dipasang di depan endpoint admin yang butuh proteksi. Cek header
// 'Authorization: Bearer <token>', validasi tokennya, baru lanjut ke
// controller kalau valid. Kalau nggak ada/nggak valid, langsung ditolak
// dengan 401 - controller di baliknya nggak pernah dijalankan.

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./auth_controller.js");

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token tidak ditemukan. Silakan login terlebih dahulu.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded; // bisa dipakai controller kalau perlu tau siapa yang login
    next();
  } catch (error) {
    // Token expired atau memang invalid/dipalsukan - log pesan aslinya di
    // terminal server biar gampang di-debug (pesan spesifik jwt.verify
    // biasanya jelas: 'invalid signature', 'jwt expired', 'jwt malformed', dst)
    console.error("Auth middleware menolak token:", error.message);
    return res.status(401).json({
      success: false,
      message: "Sesi login tidak valid atau sudah habis. Silakan login ulang.",
    });
  }
}

module.exports = { requireAdminAuth };