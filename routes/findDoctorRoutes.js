const express = require("express");

const {
    getDoctors,
    getDoctorById,
} = require("../controllers/findDoctorController");

const router = express.Router();

// =========================================================
// GET ALL DOCTORS
// GET /api/find-doctors
// =========================================================

router.get(
    "/",
    getDoctors
);

// =========================================================
// GET SINGLE DOCTOR
// GET /api/find-doctors/:doctorId
// =========================================================

router.get(
    "/:doctorId",
    getDoctorById
);

module.exports = router;