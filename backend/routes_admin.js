// routes_admin.js
const express = require("express");
const router = express.Router();
const { getParticipants, getParticipantDetail } = require("./admin_controller"); // sesuaikan path

// Daftar peserta yang sudah mengisi tes (pagination + search)
router.get("/api/admin/participants", getParticipants);

// Detail hasil tes 1 peserta
router.get("/api/admin/participants/:attempt_id", getParticipantDetail);

module.exports = router;
