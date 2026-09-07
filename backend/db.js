const mysql = require("mysql2");

// Menggunakan promise agar bisa menggunakan await di server.js
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "disc_test",
}).promise();

// Cek koneksi
db.query("SELECT 1")
  .then(() => {
    console.log("MySQL berhasil terhubung!");
  })
  .catch((err) => {
    console.error("Koneksi database gagal:", err);
  });

module.exports = db;
