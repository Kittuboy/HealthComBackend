const express = require("express");

const {
    getDoctorDashboard,
    acceptAppointment,
    rejectAppointment,
} = require("../controllers/doctorDashboardController");

const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// DOCTOR DASHBOARD
// ==========================================

router.get(
    "/dashboard",
    authMiddleware,
    getDoctorDashboard
);


router.put(
    "/appointments/accept",
    authMiddleware,
    acceptAppointment
);

router.put(
    "/appointments/reject",
    authMiddleware,
    rejectAppointment
);

module.exports = router;