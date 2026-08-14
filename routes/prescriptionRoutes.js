const express = require("express");

const router = express.Router();

const {
    createPrescription,
    getPatientPrescriptions,
    getPrescriptionById,
} = require("../controllers/prescriptionController");


// =========================================================
// AUTH MIDDLEWARE
// =========================================================

const protect =
    require("../middleware/authMiddleware");


// =========================================================
// PATIENT PRESCRIPTIONS
// =========================================================

router.get(
    "/patient",
    protect,
    getPatientPrescriptions
);


// =========================================================
// SINGLE PRESCRIPTION
// =========================================================

router.get(
    "/:prescriptionId",
    protect,
    getPrescriptionById
);


// =========================================================
// CREATE PRESCRIPTION
// =========================================================

router.post(
    "/create",
    protect,
    createPrescription
);


module.exports = router;