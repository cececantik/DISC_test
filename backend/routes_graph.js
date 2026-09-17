// routes/graph.js
const express = require('express');
const router = express.Router();
const { getGraphs } = require('./graph_controller'); // sesuaikan path

router.get('/api/graphs/:attempt_id', getGraphs);

module.exports = router;
