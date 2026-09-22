// admin_controller.js
// Berisi logic untuk fitur role Admin:
// 1. Melihat daftar peserta yang sudah mengisi tes (dengan pagination + pencarian nama)
// 2. Melihat detail hasil tes 1 peserta (dipakai oleh admin-detail.html)
const db = require("./db.js");

// Helper: tentukan tipe dominan dari skor "Change" (Self/Core),
// sama seperti logic di endpoint /api/review/:attempt_id
function getDominantType(r) {
  const changeScores = {
    D: r.change_d,
    I: r.change_i,
    S: r.change_s,
    C: r.change_c,
  };
  return Object.keys(changeScores).reduce((a, b) =>
    changeScores[a] >= changeScores[b] ? a : b,
  );
}

// ==========================================
// GET /api/admin/participants?page=1&limit=10&search=nama
// Daftar peserta yang SUDAH mengisi tes (punya baris di tabel `results`),
// diurutkan dari yang paling baru mengerjakan tes.
// ==========================================
async function getParticipants(req, res) {
  try {
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
    const offset = (page - 1) * limit;

    const search = (req.query.search || "").trim();
    let whereClause = "";
    const whereParams = [];
    if (search) {
      whereClause = "WHERE u.nama_lengkap LIKE ?";
      whereParams.push(`%${search}%`);
    }

    // Total data (untuk hitung total halaman)
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM results r
       JOIN attempts a ON r.attempt_id = a.id
       JOIN users u ON a.user_id = u.id
       ${whereClause}`,
      whereParams,
    );
    const total = countRows[0].total;

    // Data per halaman
    const [rows] = await db.query(
      `SELECT r.attempt_id, r.change_d, r.change_i, r.change_s, r.change_c, r.created_at,
              u.id AS user_id, u.nama_lengkap, u.umur, u.pendidikan_terakhir,
              u.pekerjaan, u.jenis_kelamin
       FROM results r
       JOIN attempts a ON r.attempt_id = a.id
       JOIN users u ON a.user_id = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset],
    );

    const data = rows.map((r) => ({
      attempt_id: r.attempt_id,
      user_id: r.user_id,
      nama_lengkap: r.nama_lengkap,
      umur: r.umur,
      pendidikan_terakhir: r.pendidikan_terakhir,
      pekerjaan: r.pekerjaan,
      jenis_kelamin: r.jenis_kelamin,
      tanggal_tes: r.created_at,
      dominant_type: getDominantType(r),
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("Error saat mengambil daftar peserta:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memuat daftar peserta dari database.",
    });
  }
}

// ==========================================
// GET /api/admin/participants/:attempt_id
// Detail hasil tes 1 peserta (data diri + skor Most/Least/Change).
// Gambar grafik tetap diambil terpisah lewat /api/graphs/:attempt_id
// (endpoint yang sudah ada), sama seperti alur di review.html.
// ==========================================
async function getParticipantDetail(req, res) {
  const { attempt_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT r.*, u.nama_lengkap, u.umur, u.pendidikan_terakhir,
              u.pekerjaan, u.jenis_kelamin
       FROM results r
       JOIN attempts a ON r.attempt_id = a.id
       JOIN users u ON a.user_id = u.id
       WHERE r.attempt_id = ?`,
      [attempt_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data hasil tes untuk peserta ini tidak ditemukan.",
      });
    }

    const r = rows[0];
    const dominant_type = getDominantType(r);

    res.json({
      success: true,
      data: {
        attempt_id: r.attempt_id,
        nama_lengkap: r.nama_lengkap,
        umur: r.umur,
        pendidikan_terakhir: r.pendidikan_terakhir,
        pekerjaan: r.pekerjaan,
        jenis_kelamin: r.jenis_kelamin,
        tanggal_tes: r.created_at,
        dominant_type,

        most: {
          D: r.most_d,
          I: r.most_i,
          S: r.most_s,
          C: r.most_c,
          star: r.most_star,
        },
        least: {
          D: r.least_d,
          I: r.least_i,
          S: r.least_s,
          C: r.least_c,
          star: r.least_star,
        },
        change: {
          D: r.change_d,
          I: r.change_i,
          S: r.change_s,
          C: r.change_c,
          star: r.change_star,
        },
      },
    });
  } catch (error) {
    console.error("Error saat mengambil detail peserta:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memuat detail hasil tes dari database.",
    });
  }
}

module.exports = { getParticipants, getParticipantDetail };
