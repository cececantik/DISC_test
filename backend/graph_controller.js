// graphController.js
const axios = require('axios');
const db = require('./db.js'); // sesuaikan path - ini asumsi db.js ada di folder yang sama

const PYTHON_SERVICE_URL = 'http://127.0.0.1:5000';

async function getGraphs(req, res) {
  const { attempt_id } = req.params;

  try {
    // 1. Ambil scoring data dari MySQL
    // db.query() dari mysql2/promise selalu balikin [rows, fields] - kita cuma butuh rows
    const [rows] = await db.query(
      'SELECT * FROM results WHERE attempt_id = ?', [attempt_id]
    );

    const scoringData = rows[0]; // ambil baris pertama (harusnya cuma ada 1 per attempt_id)

    if (!scoringData) {
      return res.status(404).json({ error: 'Attempt tidak ditemukan' });
    }

    // 2. Call Python service
    console.log("=== GRAPH REQUEST ===");
    console.log("URL:", `${PYTHON_SERVICE_URL}/generate-graph`);
    console.log("attempt_id:", attempt_id);
    console.log("scoringData:", JSON.stringify(scoringData, null, 2));

    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/generate-graph`,
      { attempt_id, ...scoringData },
      { timeout: 10000 } // penting: matplotlib render nggak instan, kasih ruang waktu
    );

    console.log("=== GRAPH RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Data:", response.data);

    return res.json(response.data);

  } catch (err) {
    // Query MySQL gagal (misal attempt_id bukan angka, atau kolom nggak sesuai)
    if (err.code && err.code.startsWith('ER_')) {
      console.error('MySQL error:', err.message);
      return res.status(500).json({ error: 'Gagal ambil data dari database' });
    }

    // Python service (Flask) belum nyala / mati
    if (err.code === 'ECONNREFUSED') {
      console.error('Python graph service tidak merespons di', PYTHON_SERVICE_URL);
      return res.status(503).json({ error: 'Graph service sedang down' });
    }

    // Field scoring hilang/tidak valid - Flask balikin 400 dengan pesan jelas
    if (err.response && err.response.status === 400) {
      console.error('Data scoring tidak valid:', err.response.data);
      return res.status(400).json(err.response.data);
    }

    if (err.response && err.response.status === 400) {
      console.error(
        'Data scoring tidak valid:',
        err.response.data
      );

      return res.status(400).json(err.response.data);
    }

    // Error lainnya
    console.error(
      'Graph controller error:',
      err.message
    );

    if (err.response) {
      console.error(
        'Python response status:',
        err.response.status
      );

      console.error(
        'Python response data:',
        err.response.data
      );
    }

    return res.status(500).json({
      error: 'Terjadi kesalahan pada graph controller',
      detail: err.message
    });
  }
}

module.exports = { getGraphs };