const express = require("express");

const router =
    express.Router();


const {

    getDoctorAppointments,

    getDoctorAppointmentById,

    getDoctorAppointmentStats

} = require("../controllers/doctorAppointmentController");


const protect =
    require("../../middleware/authMiddleware");


/*
====================================================
GET ALL DOCTOR APPOINTMENTS
====================================================
*/

router.get(

    "/appointments",

    protect,

    getDoctorAppointments

);


/*
====================================================
GET APPOINTMENT STATS
====================================================
*/

router.get(

    "/appointments/stats",

    protect,

    getDoctorAppointmentStats

);


/*
====================================================
GET SINGLE APPOINTMENT
====================================================
*/

router.get(

    "/appointments/:appointmentId",

    protect,

    getDoctorAppointmentById

);


module.exports = router;