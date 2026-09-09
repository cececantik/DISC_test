const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 1. ENDPOINT UNTUK MENAMPILKAN SOAL KE test.html
// ==========================================
app.get("/api/questions", async (req, res) => {
  try {
    const [questions] = await db.query(
      "SELECT * FROM questions ORDER BY id ASC",
    );

    let fullData = [];

    for (let q of questions) {
      const [options] = await db.query(
        "SELECT id, teks, tipe_most, tipe_least FROM options WHERE question_id = ?",
        [q.id],
      );

      fullData.push({
        id: q.id,
        nomor: q.nomor || q.id,
        options: options,
      });
    }

    res.json({ success: true, data: fullData });
  } catch (error) {
    console.error("Error saat mengambil soal:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal memuat soal dari database." });
  }
});

// ==========================================
// 2. ENDPOINT UNTUK MENYIMPAN JAWABAN & HITUNG SKOR
// (Kode yang Anda miliki ditaruh di sini)
// ==========================================
app.post("/api/submit-test", async (req, res) => {
  const { attempt_id, answers } = req.body;

  try {
    let scoreMost = { D: 0, I: 0, S: 0, C: 0, star: 0 };
    let scoreLeast = { D: 0, I: 0, S: 0, C: 0, star: 0 };

    for (let ans of answers) {
      // 1. Ambil tipe_most berdasarkan ID opsi Most yang dikirim test.html
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

      // 2. Ambil tipe_least berdasarkan ID opsi Least yang dikirim test.html
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

    // Hitung Skor Change (Grafik 3)
    let scoreChange = {
      D: scoreMost.D - scoreLeast.D,
      I: scoreMost.I - scoreLeast.I,
      S: scoreMost.S - scoreLeast.S,
      C: scoreMost.C - scoreLeast.C,
      star: scoreMost.star + scoreLeast.star,
    };

    // Simpan ringkasan skor ke tabel `scores`
    // Simpan ringkasan skor ke tabel `results`
    await db.query(
      `INSERT INTO results 
            (attempt_id, most_d, most_i, most_s, most_c, most_star, least_d, least_i, least_s, least_c, least_star, change_d, change_i, change_s, change_c, change_star) 
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

    res.json({ success: true, message: "Tes berhasil disimpan dan dihitung!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Terjadi kesalahan pada server saat menghitung skor.",
      });
  }
});

// ==========================================
// 3. ENDPOINT UNTUK MENYIMPAN DATA DIRI & MEMBUAT ATTEMPT_ID
// ==========================================
app.post("/api/register", async (req, res) => {
  const { nama_lengkap, umur, pendidikan_terakhir, pekerjaan, jenis_kelamin } =
    req.body;
  let connection;

  try {
    if (!nama_lengkap || !nama_lengkap.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nama lengkap wajib diisi.",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [userResult] = await connection.query(
      `INSERT INTO users
       (nama_lengkap, umur, pendidikan_terakhir, pekerjaan, jenis_kelamin)
       VALUES (?, ?, ?, ?, ?)`,
      [
        nama_lengkap.trim(),
        umur || null,
        pendidikan_terakhir || null,
        pekerjaan || null,
        jenis_kelamin || null,
      ],
    );

    const userId = userResult.insertId;
    const [attemptResult] = await connection.query(
      `INSERT INTO attempts (user_id, status) VALUES (?, 'in_progress')`,
      [userId],
    );

    const attemptId = attemptResult.insertId;
    await connection.commit();

    res.json({
      success: true,
      message: "Data diri berhasil disimpan!",
      attempt_id: attemptId,
      user_id: userId,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error saat menyimpan data diri:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal menyimpan data diri ke database.",
      });
  } finally {
    if (connection) {
      connection.release();
    }
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

// ==========================================
// 1. MENGAMBIL SEMUA 24 SOAL + 4 PILIHAN (Sekaligus)
// ==========================================
app.get("/questions", (req, res) => {
  const sql = `
    SELECT 
      q.id AS question_id,
      q.nomor,
      o.id AS option_id,
      o.option_order,
      o.teks
    FROM questions q
    JOIN options o ON q.id = o.question_id
    ORDER BY q.nomor, o.option_order
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error mengambil questions:", err);
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil daftar pertanyaan",
        error: err.message,
      });
    }

    // Kelompokkan opsi ke dalam masing-masing nomor soal
    const formattedData = [];
    results.forEach((row) => {
      let q = formattedData.find(
        (item) => item.question_id === row.question_id,
      );
      if (!q) {
        q = {
          question_id: row.question_id,
          nomor: row.nomor,
          options: [],
        };
        formattedData.push(q);
      }
      q.options.push({
        option_id: row.option_id,
        order: row.option_order,
        teks: row.teks,
      });
    });

    res.json({
      success: true,
      data: formattedData,
    });
  });
});

// ==========================================
// 2. MENGAMBIL 1 SOAL TERTENTU (Step-by-Step)
// ==========================================
app.get("/questions/:nomor", (req, res) => {
  const nomor = req.params.nomor;

  const sql = `
    SELECT
      q.id AS question_id,
      q.nomor,
      q.pertanyaan,
      o.id AS option_id,
      o.option_order,
      o.teks
    FROM questions q
    JOIN options o ON q.id = o.question_id
    WHERE q.nomor = ?
    ORDER BY o.option_order
  `;

  db.query(sql, [nomor], (err, results) => {
    if (err) {
      console.error("Error mengambil soal:", err);
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil soal",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Soal tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
});

// ==========================================
// 3. SUBMIT TES: SIMPAN JAWABAN & HITUNG SKOR
// ==========================================
app.post("/submit-test", (req, res) => {
  const { user, answers } = req.body;

  // Validasi input
  if (!user || !answers || answers.length !== 24) {
    return res.status(400).json({
      success: false,
      message: "Data peserta atau 24 nomor jawaban belum lengkap",
    });
  }

  // A. Simpan User
  const sqlUser = `
    INSERT INTO users (nama_lengkap, umur, pendidikan_terakhir, pekerjaan, jenis_kelamin)
    VALUES (?, ?, ?, ?, ?)
  `;
  const userParams = [
    user.nama_lengkap,
    user.umur,
    user.pendidikan_terakhir,
    user.pekerjaan,
    user.jenis_kelamin,
  ];

  db.query(sqlUser, userParams, (errUser, resUser) => {
    if (errUser) {
      console.error("Gagal simpan user:", errUser);
      return res
        .status(500)
        .json({ success: false, message: "Gagal menyimpan data user" });
    }

    const userId = resUser.insertId;

    // B. Buat Attempt
    const sqlAttempt = `INSERT INTO attempts (user_id, status) VALUES (?, 'in_progress')`;
    db.query(sqlAttempt, [userId], (errAttempt, resAttempt) => {
      if (errAttempt) {
        console.error("Gagal simpan attempt:", errAttempt);
        return res
          .status(500)
          .json({ success: false, message: "Gagal membuat sesi tes" });
      }

      const attemptId = resAttempt.insertId;

      // C. Siapkan Array 24 Jawaban
      const answerRows = answers.map((ans) => [
        attemptId,
        ans.question_id,
        ans.most_option_id,
        ans.least_option_id,
      ]);

      const sqlAnswers = `
        INSERT INTO answers (attempt_id, question_id, most_option_id, least_option_id)
        VALUES ?
      `;

      db.query(sqlAnswers, [answerRows], (errAns) => {
        if (errAns) {
          console.error("Gagal simpan jawaban:", errAns);
          return res
            .status(500)
            .json({ success: false, message: "Gagal menyimpan jawaban" });
        }

        // D. Panggil Stored Procedure Hitung Skor DISC
        db.query("CALL CalculateDiscScores(?)", [attemptId], (errCalc) => {
          if (errCalc) {
            console.error("Gagal hitung skor:", errCalc);
            return res
              .status(500)
              .json({ success: false, message: "Gagal menghitung skor tes" });
          }

          // E. Ambil Hasil Akhir
          const sqlResult = `
            SELECT 
              r.*,
              u.nama_lengkap
            FROM results r
            JOIN attempts a ON r.attempt_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE r.attempt_id = ?
          `;

          db.query(sqlResult, [attemptId], (errRes, rowsRes) => {
            if (errRes || rowsRes.length === 0) {
              console.error("Gagal mengambil hasil:", errRes);
              return res
                .status(500)
                .json({ success: false, message: "Gagal memuat hasil tes" });
            }

            res.json({
              success: true,
              message: "Tes berhasil diselesaikan",
              attempt_id: attemptId,
              result: rowsRes[0],
            });
          });
        });
      });
    });
  });
});

// ==========================================
// MENJALANKAN SERVER
// ==========================================
app.listen(3000, () => {
  console.log("----------------------------------");
  console.log("Server DISC berhasil dijalankan!");
  console.log("http://localhost:3000");
  console.log("----------------------------------");
});
