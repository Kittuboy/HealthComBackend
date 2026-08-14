
const express = require("express");

const {
    bookAppointment,
    getUpcomingAppointment,
    getAppointmentDetails,
    getPatientAppointments,
    getUpcomingPatientAppointment,
    cancelAppointment,
    acceptAppointment,
    rejectAppointment,
    startAppointmentCall,
    getAppointmentCall,
} = require("../controllers/appointmentController");

const {
    sendNotification
} = require("../services/notificationService");

const router =
    express.Router();


// =========================================================
// BOOK APPOINTMENT
// =========================================================

router.post(
    "/book",
    bookAppointment
);
router.get(
    "/upcoming/:patientId",
    getUpcomingAppointment
);


// =========================================================
// GET APPOINTMENT DETAILS
// =========================================================

router.get(
    "/:appointmentId",
    getAppointmentDetails
);

// =========================================================
// GET ALL PATIENT APPOINTMENTS
// =========================================================

router.get(
    "/patient/:patientId",
    getPatientAppointments
);


// =========================================================
// CANCEL APPOINTMENT
// =========================================================

router.post(
    "/cancel",
    cancelAppointment
);

// =========================================================
// ACCEPT APPOINTMENT
// =========================================================

router.post(
    "/accept",
    acceptAppointment
);


// =========================================================
// REJECT APPOINTMENT
// =========================================================

router.post(
    "/reject",
    rejectAppointment
);



// =========================================================
// START / JOIN VIDEO CALL
// =========================================================

router.post(
    "/call/start",
    startAppointmentCall
);


// =========================================================
// GET VIDEO CALL ROOM
// =========================================================

router.get(
    "/call/:appointmentId",
    getAppointmentCall
);

module.exports =
    router;
