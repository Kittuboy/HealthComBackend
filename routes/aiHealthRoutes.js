
const express = require("express");

const {
    chatWithAIHealth,
    getAIHealthHistory,
} = require("../controllers/aiHealthController");

const router = express.Router();


// =========================================================
// AI HEALTH CHAT
// =========================================================

router.post(
    "/chat",
    chatWithAIHealth
);


// =========================================================
// AI HEALTH CHAT HISTORY
// =========================================================

router.get(
    "/history/:patientId/:sessionId",
    getAIHealthHistory
);


module.exports = router;
