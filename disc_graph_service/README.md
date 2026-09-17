# DISC Graph Service (Python + Flask)

Service kecil yang menerima scoring data dari Express backend, lalu
menghasilkan 3 grafik profil DISC (Mask, Pressure, Self) dalam format
base64 PNG, plus interpretasi singkat.

## Cara pakai desain graph

Alih-alih 3 graph memakai data yang sama, service ini memakai format
klasik DISC assessment:

| Graph | Data sumber | Artinya |
|---|---|---|
| **Mask** | `most_d, most_i, most_s, most_c` | Perilaku yang terlihat orang lain (public self) |
| **Pressure** | `least_d, least_i, least_s, least_c` | Reaksi saat di bawah tekanan (private self) |
| **Self** | `change_d, change_i, change_s, change_c` | Kepribadian inti/asli (core self) |

Kalau ternyata di project kamu ketiga graph memang dimaksudkan pakai
data yang sama (`change_*` untuk semuanya), tinggal ubah `GRAPH_STYLES`
di `graph_generator.py` — struktur & style rendering-nya tidak perlu
diubah.

## Setup

```bash
cd disc_graph_service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Test cepat (tanpa jalankan server)

```bash
python test_sample.py
```

Ini akan generate `preview_mask.png`, `preview_pressure.png`,
`preview_self.png` di folder yang sama, supaya kamu bisa cek hasilnya
langsung tanpa perlu setup Express dulu.

## Jalankan service

```bash
python app.py
# listening di http://localhost:5000
```

## Endpoint

### `POST /generate-graph`

**Request body** (sama persis dengan row `results` table kamu):

```json
{
  "attempt_id": 2,
  "most_d": 5, "most_i": 6, "most_s": 4, "most_c": 9, "most_star": 0,
  "least_d": 3, "least_i": 2, "least_s": 8, "least_c": 5, "least_star": 6,
  "change_d": 2, "change_i": 4, "change_s": -4, "change_c": 4, "change_star": 6
}
```

**Response 200**:

```json
{
  "attempt_id": 2,
  "graphs": {
    "mask": { "image_base64": "iVBORw0KG...", "format": "png" },
    "pressure": { "image_base64": "iVBORw0KG...", "format": "png" },
    "self": { "image_base64": "iVBORw0KG...", "format": "png" }
  },
  "interpretation": {
    "dominant_trait": "I",
    "dominant_score": 4,
    "secondary_trait": "C",
    "secondary_score": 4,
    "summary": "Cenderung ramah, persuasif, ...",
    "raw_scores": {"D": 2, "I": 4, "S": -4, "C": 4}
  }
}
```

**Error responses**: `400` kalau field scoring hilang/tidak valid,
`500` kalau rendering gagal karena hal tak terduga.

### `GET /health`

Untuk health check, dipakai Express untuk cek apakah Python service
up sebelum call `/generate-graph`.

## Integrasi ke Express (axios)

```js
// graphController.js
const axios = require('axios');

async function getGraphs(req, res) {
  const { attempt_id } = req.params;

  // 1. Ambil scoring data dari MySQL (query yang sudah ada)
  const scoringData = await db.query(
    'SELECT * FROM results WHERE attempt_id = ?', [attempt_id]
  );

  if (!scoringData) {
    return res.status(404).json({ error: 'Attempt tidak ditemukan' });
  }

  // 2. Call Python service
  try {
    const response = await axios.post(
      'http://localhost:5000/generate-graph',
      { attempt_id, ...scoringData },
      { timeout: 10000 } // penting: set timeout, matplotlib render tidak instan
    );

    return res.json(response.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Graph service sedang down' });
    }
    return res.status(500).json({ error: 'Gagal generate graph' });
  }
}

module.exports = { getGraphs };
```

Frontend cukup render:

```html
<img src="data:image/png;base64,{{graphs.mask.image_base64}}" alt="Mask graph" />
```

## Edge cases yang sudah di-handle

- **Field scoring hilang** → `400` dengan pesan field mana yang hilang
  (bukan crash 500 yang membingungkan).
- **Field bukan angka** → divalidasi sebelum masuk matplotlib.
- **Nilai negatif** (`change_s: -4` dsb) → graph "Self" pakai garis nol
  putus-putus, label otomatis pindah ke bawah titik supaya tidak
  tertimpa.
- **Semua nilai di satu dimensi** (misal semua jawaban = D) → tetap
  ter-render normal, hanya bentuk grafiknya jadi datar di satu sisi.

## Yang masih perlu kamu putuskan / sesuaikan

1. **Konfirmasi mapping 3 graph** — apakah asumsi Mask/Pressure/Self di
   atas sudah sesuai desain kamu, atau kamu mau ketiganya pakai
   `change_*` yang sama?
2. **Caching** — kalau 1 attempt bisa di-fetch berkali-kali, pertimbangkan
   simpan base64 hasil generate ke tabel `disc_graphs` (sudah ada di
   schema kamu) supaya tidak re-render tiap request.
3. **Production server** — `app.run(debug=True)` hanya untuk development.
   Untuk deploy, pakai `gunicorn app:app` atau sejenisnya.
