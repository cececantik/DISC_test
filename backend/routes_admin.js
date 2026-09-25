// routes_admin.js
const express = require("express");
const router = express.Router();
const { getParticipants, getParticipantDetail } = require("./admin_controller"); // sesuaikan path
const { login } = require("./auth_controller");
const { requireAdminAuth } = require("./auth_middleware");

router.post("/api/admin/login", login);
// Daftar peserta yang sudah mengisi tes (pagination + search)
router.get("/api/admin/participants", requireAdminAuth, getParticipants);
router.get("/api/admin/participants/:attempt_id", requireAdminAuth, getParticipantDetail);
module.exports = router;
