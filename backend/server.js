const express = require("express");
const cors = require("cors");
const db = require("./db");

const { getParticipants, getParticipantDetail } = require("./admin_controller");
const { getGraphs } = require("./graph_controller");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// ROUTE ADMIN
// ==========================================
app.get("/api/admin/participants", getParticipants);
app.get("/api/admin/participants/:attempt_id", getParticipantDetail);

// ==========================================
// ROUTE GRAFIK DISC
// ==========================================
app.get("/api/graphs/:attempt_id", getGraphs);

// ==========================================
// 1. ENDPOINT UNTUK MENAMPILKAN SOAL KE test.html
// ==========================================
app.get("/api/questions", async (req, res) => {
  try {
    const [questions] = await db.query(
      "SELECT * FROM questions ORDER BY id ASC",
    );

    const fullData = [];

    for (const q of questions) {
      const [options] = await db.query(
        "SELECT id, teks, tipe_most, tipe_least FROM options WHERE question_id = ?",
        [q.id],
      );

      fullData.push({
        id: q.id,
        nomor: q.nomor || q.id,
        options,
      });
    }

    res.json({ success: true, data: fullData });
  } catch (error) {
    console.error("Error saat mengambil soal:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memuat soal dari database.",
    });
  }
});

// ==========================================
// 2. ENDPOINT UNTUK MENYIMPAN JAWABAN & HITUNG SKOR
// ==========================================
app.post("/api/submit-test", async (req, res) => {
  const { attempt_id, answers } = req.body;

  if (!attempt_id || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Data attempt_id atau jawaban tidak lengkap.",
    });
  }

  try {
    const [attemptCheck] = await db.query(
      "SELECT id FROM attempts WHERE id = ?",
      [attempt_id],
    );

    if (attemptCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attempt_id tidak ditemukan. Silakan mulai tes dari awal.",
      });
    }

    const scoreMost = { D: 0, I: 0, S: 0, C: 0, star: 0 };
    const scoreLeast = { D: 0, I: 0, S: 0, C: 0, star: 0 };
    const answerRows = [];

    for (const ans of answers) {
      if (
        !ans ||
        !ans.question_id ||
        !ans.most_option_id ||
        !ans.least_option_id
      ) {
        return res.status(400).json({
          success: false,
          message: "Ada jawaban yang tidak lengkap.",
        });
      }

      answerRows.push([
        attempt_id,
        ans.question_id,
        ans.most_option_id,
        ans.least_option_id,
      ]);

      const [mostRows] = await db.query(
        "SELECT tipe_most FROM options WHERE id = ?",
        [ans.most_option_id],
      );

      if (mostRows.length > 0) {
        const tm = mostRows[0].tipe_most;
        if (tm === "D") scoreMost.D++;
        else if (tm === "I") scoreMost.I++;
        else if (tm === "S") scoreMost.S++;
        else if (tm === "C") scoreMost.C++;
        else if (tm === "*") scoreMost.star++;
      }

      const [leastRows] = await db.query(
        "SELECT tipe_least FROM options WHERE id = ?",
        [ans.least_option_id],
      );

      if (leastRows.length > 0) {
        const tl = leastRows[0].tipe_least;
        if (tl === "D") scoreLeast.D++;
        else if (tl === "I") scoreLeast.I++;
        else if (tl === "S") scoreLeast.S++;
        else if (tl === "C") scoreLeast.C++;
        else if (tl === "*") scoreLeast.star++;
      }
    }

    const scoreChange = {
      D: scoreMost.D - scoreLeast.D,
      I: scoreMost.I - scoreLeast.I,
      S: scoreMost.S - scoreLeast.S,
      C: scoreMost.C - scoreLeast.C,
      star: scoreMost.star + scoreLeast.star,
    };

    await db.query(
      `INSERT INTO answers (attempt_id, question_id, most_option_id, least_option_id)
       VALUES ?`,
      [answerRows],
    );

    await db.query(
      `INSERT INTO results
       (attempt_id, most_d, most_i, most_s, most_c, most_star,
        least_d, least_i, least_s, least_c, least_star,
        change_d, change_i, change_s, change_c, change_star)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attempt_id,
        scoreMost.D,
        scoreMost.I,
        scoreMost.S,
        scoreMost.C,
        scoreMost.star,
        scoreLeast.D,
        scoreLeast.I,
        scoreLeast.S,
        scoreLeast.C,
        scoreLeast.star,
        scoreChange.D,
        scoreChange.I,
        scoreChange.S,
        scoreChange.C,
        scoreChange.star,
      ],
    );

    await db.query(
      "UPDATE attempts SET status = 'completed', completed_at = NOW() WHERE id = ?",
      [attempt_id],
    );

    const [resultRows] = await db.query(
      "SELECT * FROM results WHERE attempt_id = ? ORDER BY id DESC LIMIT 1",
      [attempt_id],
    );

    res.json({
      success: true,
      message: "Tes berhasil disimpan dan dihitung!",
      attempt_id,
      result: resultRows[0],
    });
  } catch (error) {
    console.error("Submit test error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server saat menghitung skor.",
      error: error.message,
    });
  }
});

app.get("/api/review/:attempt_id", async (req, res) => {
  const { attempt_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT r.*, u.nama_lengkap
       FROM results r
       JOIN attempts a ON a.id = r.attempt_id
       JOIN users u ON u.id = a.user_id
       WHERE r.attempt_id = ?`,
      [attempt_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hasil tes tidak ditemukan.",
      });
    }

    const result = rows[0];

    res.json({
      success: true,
      data: {
        attempt_id: result.attempt_id,
        nama_lengkap: result.nama_lengkap,
        most: {
          D: result.most_d,
          I: result.most_i,
          S: result.most_s,
          C: result.most_c,
          star: result.most_star,
        },
        least: {
          D: result.least_d,
          I: result.least_i,
          S: result.least_s,
          C: result.least_c,
          star: result.least_star,
        },
        change: {
          D: result.change_d,
          I: result.change_i,
          S: result.change_s,
          C: result.change_c,
          star: result.change_star,
        },
        is_custom: false,
      },
    });
  } catch (error) {
    console.error("Review error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memuat hasil tes.",
      error: error.message,
    });
  }
});

// ==========================================
// 3. ENDPOINT UNTUK MENYIMPAN DATA DIRI & MEMBUAT ATTEMPT_ID
// ==========================================
app.post("/api/register", async (req, res) => {
  const {
    nama_lengkap,
    umur,
    pendidikan_terakhir,
    pekerjaan,
    jenis_kelamin,
  } = req.body;

  if (!nama_lengkap) {
    return res.status(400).json({
      success: false,
      message: "Nama lengkap wajib diisi.",
    });
  }

  try {
    const [userResult] = await db.query(
      `INSERT INTO users (nama_lengkap, umur, pendidikan_terakhir, pekerjaan, jenis_kelamin)
       VALUES (?, ?, ?, ?, ?)`,
      [nama_lengkap, umur, pendidikan_terakhir, pekerjaan, jenis_kelamin],
    );

    const userId = userResult.insertId;

    const [attemptResult] = await db.query(
      `INSERT INTO attempts (user_id, status, started_at)
       VALUES (?, 'in_progress', NOW())`,
      [userId],
    );

    res.json({
      success: true,
      message: "Data diri berhasil disimpan!",
      attempt_id: attemptResult.insertId,
      user_id: userId,
    });

  } catch (error) {
    console.error("ERROR REGISTER:", error);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan data diri ke database.",
      error: error.message,
    });
  }
});

// ==========================================
// HALAMAN UTAMA & TEST KONEKSI
// ==========================================
app.get("/", (req, res) => {
  res.send("Server DISC berhasil berjalan!");
});

app.get("/test-db", (req, res) => {
  db.query("SELECT 1 AS test", (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database gagal terhubung",
        error: err.message,
      });
    }

    res.json({
      success: true,
      message: "Database berhasil terhubung!",
      data: results,
    });
  });
});

app.listen(3000, () => {
  console.log("----------------------------------");
  console.log("Server DISC berhasil dijalankan!");
  console.log("http://localhost:3000");
  console.log("----------------------------------");
});
