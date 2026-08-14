const Appointment = require("../models/Appointment");
const User = require("../models/User");

const {
    sendPatientAppointmentEmail,
    sendDoctorAppointmentEmail,
    sendPatientAppointmentCancellationEmail,
} = require("../services/emailService");

const {
    sendNotification,
} = require("../services/notificationService");


// =========================================================
// BOOK APPOINTMENT
// =========================================================

const bookAppointment = async (req, res) => {

    try {

        const {
            patientId,
            doctorId,
        } = req.body;


        console.log(
            "BOOK APPOINTMENT:",
            {
                patientId,
                doctorId,
            }
        );


        // =================================================
        // VALIDATION
        // =================================================

        if (!patientId || !doctorId) {

            return res.status(400).json({

                success: false,

                message:
                    "Patient and doctor are required.",

            });

        }


        // =================================================
        // CHECK PATIENT
        // =================================================

        const patient =
            await User.findOne({

                _id: patientId,

                role: "patient",

            });


        if (!patient) {

            return res.status(404).json({

                success: false,

                message:
                    "Patient not found.",

            });

        }


        // =================================================
        // CHECK DOCTOR
        // =================================================

        const doctor =
            await User.findOne({

                _id: doctorId,

                role: "doctor",

            });


        if (!doctor) {

            return res.status(404).json({

                success: false,

                message:
                    "Doctor not found.",

            });

        }


        // =================================================
        // CHECK VERIFIED DOCTOR
        // =================================================

        if (doctor.isVerified === false) {

            return res.status(400).json({

                success: false,

                message:
                    "This doctor is not currently available for booking.",

            });

        }


        // =================================================
        // CHECK EXISTING ACTIVE BOOKING
        // =================================================

        const existingAppointment =
            await Appointment.findOne({

                patientId: patientId,

                doctorId: doctorId,

                status: {

                    $in: [
                        "pending",
                        "confirmed",
                    ],

                },

            });


        if (existingAppointment) {

            return res.status(409).json({

                success: false,

                message:
                    "You already have an appointment with this doctor.",

            });

        }


        // =================================================
        // CREATE APPOINTMENT
        // =================================================

        const appointment =
            await Appointment.create({

                patientId: patientId,

                doctorId: doctorId,

                status: "pending",

            });


        console.log(
            "APPOINTMENT CREATED:",
            appointment._id
        );


        // =================================================
        // DOCTOR NAME
        // =================================================

        const doctorName =
            `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`
                .replace(/\s+/g, " ")
                .trim();


        // =================================================
        // PATIENT NAME
        // =================================================

        const patientName =
            `${patient.firstName || ""} ${patient.lastName || ""}`
                .replace(/\s+/g, " ")
                .trim();


        // =================================================
        // DOCTOR SPECIALIZATION
        // =================================================

        const specialty =
            doctor.specialization ||
            doctor.specialty ||
            doctor.department ||
            "General Physician";


        // =================================================
        // APPOINTMENT DATE / TIME
        // =================================================

        const appointmentDate =
            "To be scheduled";


        const appointmentTime =
            "To be scheduled";


        // =================================================
        // SEND EMAIL TO PATIENT
        // =================================================

        try {

            await sendPatientAppointmentEmail({

                email:
                    patient.email,

                firstName:
                    patient.firstName ||
                    "Patient",

                doctorName:
                    doctorName,

                specialty:
                    specialty,

                appointmentDate:
                    appointmentDate,

                appointmentTime:
                    appointmentTime,

            });


            console.log(
                "Patient appointment email sent successfully."
            );


        } catch (emailError) {

            console.error(
                "Patient appointment email failed:",
                emailError.message
            );

        }


        // =================================================
        // SEND EMAIL TO DOCTOR
        // =================================================

        try {

            await sendDoctorAppointmentEmail({

                email:
                    doctor.email,

                firstName:
                    doctor.firstName ||
                    "Doctor",

                patientName:
                    patientName,

                patientEmail:
                    patient.email,

                patientPhone:
                    patient.phone ||
                    "Not provided",

                doctorName:
                    doctorName,

                appointmentDate:
                    appointmentDate,

                appointmentTime:
                    appointmentTime,

            });


            console.log(
                "Doctor appointment email sent successfully."
            );


        } catch (emailError) {

            console.error(
                "Doctor appointment email failed:",
                emailError.message
            );

        }


        // =================================================
        // PATIENT NOTIFICATION
        // Appointment is currently created as CONFIRMED
        // =================================================

        try {

            await sendNotification({

                userId:
                    patientId,

                title:
                    "Appointment Request Sent",

                message:
                    `Your appointment request with ${doctorName} has been sent. Please wait for the doctor to accept it.`,

                type:
                    "appointment",

                data: {

                    appointmentId:
                        appointment._id.toString(),

                    doctorId:
                        doctorId.toString(),

                    status:
                        "confirmed",

                },

            });


            console.log(
                "Patient appointment notification sent."
            );


        } catch (notificationError) {

            // =============================================
            // IMPORTANT
            // Notification failure should NOT cancel booking
            // =============================================

            console.error(
                "Patient notification failed:",
                notificationError.message
            );

        }


        // =================================================
        // DOCTOR NOTIFICATION
        // =================================================

        try {

            await sendNotification({

                userId:
                    doctorId,

                title:
                    "New Appointment",

                message:
                    `${patientName} has requested an appointment with you. Please accept or reject the request.`,

                type:
                    "appointment",

                data: {

                    appointmentId:
                        appointment._id.toString(),

                    patientId:
                        patientId.toString(),

                    status:
                        "pending",

                },

            });


            console.log(
                "Doctor appointment notification sent."
            );


        } catch (notificationError) {

            // =============================================
            // IMPORTANT
            // Notification failure should NOT cancel booking
            // =============================================

            console.error(
                "Doctor notification failed:",
                notificationError.message
            );

        }


        // =================================================
        // POPULATE APPOINTMENT
        // =================================================

        const populatedAppointment =
            await Appointment.findById(
                appointment._id
            )

                .populate(
                    "patientId",
                    "firstName lastName email phone"
                )

                .populate(
                    "doctorId",
                    "firstName lastName email phone specialization specialty department profileImage image location city address"
                );


        // =================================================
        // SUCCESS RESPONSE
        // =================================================

        return res.status(201).json({

            success: true,

            message:
                "Appointment booked successfully.",

            appointment:
                populatedAppointment,

        });


    } catch (error) {

        console.error(
            "Book Appointment Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to book appointment.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,

        });

    }

};


// =========================================================
// GET PATIENT UPCOMING APPOINTMENT
// =========================================================

const getUpcomingAppointment = async (req, res) => {

    try {

        const {
            patientId
        } = req.params;


        if (!patientId) {

            return res.status(400).json({

                success: false,

                message:
                    "Patient ID is required.",

            });

        }


        const appointment =
            await Appointment.findOne({

                patientId: patientId,

                status: {

                    $in: [
                        "pending",
                        "confirmed",
                    ],

                },

            })

                .sort({

                    createdAt: -1,

                })

                .populate(
                    "doctorId",
                    "firstName lastName email phone specialization specialty department profileImage image location city address"
                );


        if (!appointment) {

            return res.status(404).json({

                success: false,

                message:
                    "No upcoming appointment found.",

            });

        }


        return res.status(200).json({

            success: true,

            appointment,

        });


    } catch (error) {

        console.error(
            "Get Upcoming Appointment Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch upcoming appointment.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,

        });

    }

};


// =========================================================
// GET APPOINTMENT DETAILS
// =========================================================

const getAppointmentDetails = async (req, res) => {

    try {

        const {
            appointmentId
        } = req.params;


        if (!appointmentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Appointment ID is required.",

            });

        }


        const appointment =
            await Appointment.findById(
                appointmentId
            )

                .populate(
                    "patientId",
                    "firstName lastName email phone gender dateOfBirth"
                )

                .populate(
                    "doctorId",
                    "firstName lastName email phone specialization specialty department profileImage image location city address"
                );


        if (!appointment) {

            return res.status(404).json({

                success: false,

                message:
                    "Appointment not found.",

            });

        }


        return res.status(200).json({

            success: true,

            appointment,

        });


    } catch (error) {

        console.error(
            "Get Appointment Details Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch appointment details.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,

        });

    }

};


// =========================================================
// GET PATIENT APPOINTMENTS
// =========================================================

const getPatientAppointments = async (req, res) => {

    try {

        const {
            patientId,
        } = req.params;


        console.log(
            "GET PATIENT APPOINTMENTS:",
            patientId
        );


        // =================================================
        // VALIDATION
        // =================================================

        if (!patientId) {

            return res.status(400).json({

                success: false,

                message:
                    "Patient ID is required.",

            });

        }


        // =================================================
        // CHECK PATIENT
        // =================================================

        const patient =
            await User.findOne({

                _id: patientId,

                role: "patient",

            });


        if (!patient) {

            return res.status(404).json({

                success: false,

                message:
                    "Patient not found.",

            });

        }


        // =================================================
        // GET APPOINTMENTS
        // =================================================

        const appointments =
            await Appointment.find({

                patientId: patientId,

                status: {

                    $in: [
                        "pending",
                        "confirmed",
                    ],

                },

            })

                .populate(
                    "doctorId",
                    "firstName lastName email phone specialization specialty department profileImage image location city address isVerified"
                )

                .sort({

                    createdAt: 1,

                });


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            count:
                appointments.length,

            appointments,

        });


    } catch (error) {

        console.error(
            "Get Patient Appointments Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch appointments.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,

        });

    }

};


// =========================================================
// GET UPCOMING PATIENT APPOINTMENT
// =========================================================

const getUpcomingPatientAppointment = async (
    req,
    res
) => {

    try {

        const {
            patientId,
        } = req.params;


        if (!patientId) {

            return res.status(400).json({

                success: false,

                message:
                    "Patient ID is required.",

            });

        }


        // =================================================
        // FIND NEXT APPOINTMENT
        // =================================================

        const appointment =
            await Appointment.findOne({

                patientId: patientId,

                status: {

                    $in: [
                        "pending",
                        "confirmed",
                    ],

                },

            })

                .populate(
                    "doctorId",
                    "firstName lastName email phone specialization specialty department profileImage image location city address isVerified"
                )

                .sort({

                    createdAt: 1,

                });


        // =================================================
        // NO APPOINTMENT
        // =================================================

        if (!appointment) {

            return res.status(404).json({

                success: false,

                message:
                    "No upcoming appointment found.",

            });

        }


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            appointment,

        });


    } catch (error) {

        console.error(
            "Get Upcoming Patient Appointment Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch upcoming appointment.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,

        });

    }

};


// =========================================================
// CANCEL APPOINTMENT
// =========================================================

const cancelAppointment = async (req, res) => {

    try {

        const {
            appointmentId,
            patientId,
        } = req.body;


        console.log(
            "CANCEL APPOINTMENT:",
            {
                appointmentId,
                patientId,
            }
        );


        // =================================================
        // VALIDATION
        // =================================================

        if (!appointmentId || !patientId) {

            return res.status(400).json({

                success: false,

                message:
                    "Appointment ID and patient ID are required.",

            });

        }


        // =================================================
        // FIND APPOINTMENT
        // Patient can cancel only their own appointment
        // =================================================

        const appointment =
            await Appointment.findOne({

                _id: appointmentId,

                patientId: patientId,

            });


        if (!appointment) {

            return res.status(404).json({

                success: false,

                message:
                    "Appointment not found.",

            });

        }


        // =================================================
        // ALREADY CANCELLED
        // =================================================

        if (
            appointment.status ===
            "cancelled"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Appointment is already cancelled.",

            });

        }


        // =================================================
        // COMPLETED APPOINTMENT
        // =================================================

        if (
            appointment.status ===
            "completed"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Completed appointments cannot be cancelled.",

            });

        }


        // =================================================
        // CANCEL APPOINTMENT
        // =================================================

        appointment.status =
            "cancelled";


        await appointment.save();


        console.log(
            "APPOINTMENT CANCELLED:",
            appointment._id
        );


        // =================================================
        // GET PATIENT
        // =================================================

        const patient =
            await User.findById(
                patientId
            );


        // =================================================
        // GET DOCTOR
        // =================================================

        const doctor =
            await User.findById(
                appointment.doctorId
            );


        // =================================================
        // DOCTOR NAME
        // =================================================

        const doctorName =
            doctor
                ? `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`
                    .replace(/\s+/g, " ")
                    .trim()
                : "Doctor";


        // =================================================
        // PATIENT NAME
        // =================================================

        const patientName =
            patient
                ? `${patient.firstName || ""} ${patient.lastName || ""}`
                    .replace(/\s+/g, " ")
                    .trim()
                : "Patient";


        // =================================================
        // SPECIALTY
        // =================================================

        const specialty =
            doctor?.specialization ||
            doctor?.specialty ||
            doctor?.department ||
            "General Physician";


        // =================================================
        // APPOINTMENT DATE / TIME
        // =================================================

        const appointmentDate =
            "To be scheduled";


        const appointmentTime =
            "To be scheduled";


        // =================================================
        // SEND CANCELLATION EMAIL TO PATIENT
        // =================================================

        if (
            patient &&
            doctor &&
            patient.email
        ) {

            try {

                await sendPatientAppointmentCancellationEmail({

                    email:
                        patient.email,

                    firstName:
                        patient.firstName ||
                        "Patient",

                    doctorName:
                        doctorName,

                    specialty:
                        specialty,

                    appointmentDate:
                        appointmentDate,

                    appointmentTime:
                        appointmentTime,

                });


                console.log(
                    "Cancellation email sent to patient:",
                    patient.email
                );


            } catch (emailError) {

                console.error(
                    "Cancellation email failed:",
                    emailError.message
                );

            }

        } else {

            console.log(
                "Cancellation email skipped: patient/doctor/email missing."
            );

        }


        // =================================================
        // NOTIFY DOCTOR
        // =================================================

        try {

            await sendNotification({

                userId:
                    appointment.doctorId.toString(),

                title:
                    "Appointment Cancelled",

                message:
                    `${patientName} has cancelled the appointment.`,

                type:
                    "appointment",

                data: {

                    appointmentId:
                        appointment._id.toString(),

                    patientId:
                        patientId.toString(),

                    status:
                        "cancelled",

                },

            });


            console.log(
                "Doctor cancellation notification sent."
            );


        } catch (notificationError) {

            console.error(
                "Doctor cancellation notification failed:",
                notificationError.message
            );

        }


        // =================================================
        // NOTIFY PATIENT
        // =================================================

        try {

            await sendNotification({

                userId:
                    patientId,

                title:
                    "Appointment Cancelled",

                message:
                    `Your appointment with ${doctorName} has been cancelled.`,

                type:
                    "appointment",

                data: {

                    appointmentId:
                        appointment._id.toString(),

                    doctorId:
                        appointment.doctorId.toString(),

                    status:
                        "cancelled",

                },

            });


            console.log(
                "Patient cancellation notification sent."
            );


        } catch (notificationError) {

            console.error(
                "Patient cancellation notification failed:",
                notificationError.message
            );

        }


        // =================================================
        // POPULATE CANCELLED APPOINTMENT
        // =================================================

        const cancelledAppointment =
            await Appointment.findById(
                appointment._id
            )

                .populate(
                    "patientId",
                    "firstName lastName email phone"
                )

                .populate(
                    "doctorId",
                    "firstName lastName email phone specialization specialty department profileImage image location city address"
                );


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "Appointment cancelled successfully.",

            appointment:
                cancelledAppointment,

        });


    } catch (error) {

        console.error(
            "Cancel Appointment Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to cancel appointment.",

            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined,

        });

    }

};


// =========================================================
// ACCEPT APPOINTMENT
// =========================================================

const acceptAppointment = async (req, res) => {

    try {

        const {
            appointmentId,
            doctorId,
        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (!appointmentId || !doctorId) {

            return res.status(400).json({

                success: false,

                message:
                    "Appointment ID and doctor ID are required.",

            });

        }


        // =================================================
        // FIND APPOINTMENT
        // =================================================

        const appointment =
            await Appointment.findOne({

                _id: appointmentId,

                doctorId: doctorId,

            });


        if (!appointment) {

            return res.status(404).json({

                success: false,

                message:
                    "Appointment not found.",

            });

        }


        // =================================================
        // CHECK STATUS
        // =================================================

        if (appointment.status !== "pending") {

            return res.status(400).json({

                success: false,

                message:
                    `Appointment cannot be accepted because its current status is ${appointment.status}.`,

            });

        }


        // =================================================
        // GET DOCTOR
        // =================================================

        const doctor =
            await User.findOne({

                _id: doctorId,

                role: "doctor",

            });


        if (!doctor) {

            return res.status(404).json({

                success: false,

                message:
                    "Doctor not found.",

            });

        }


        // =================================================
        // GET PATIENT
        // =================================================

        const patient =
            await User.findOne({

                _id: appointment.patientId,

                role: "patient",

            });


        if (!patient) {

            return res.status(404).json({

                success: false,

                message:
                    "Patient not found.",

            });

        }


        // =================================================
        // UPDATE STATUS
        // =================================================

        appointment.status =
            "confirmed";


        await appointment.save();


        console.log(
            "APPOINTMENT ACCEPTED:",
            appointment._id
        );


        // =================================================
        // DOCTOR NAME
        // =================================================

        const doctorName =
            `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`
                .replace(/\s+/g, " ")
                .trim();


        // =================================================
        // NOTIFY PATIENT
        // =================================================

        try {

            await sendNotification({

                userId:
                    patient._id.toString(),

                title:
                    "Appointment Accepted",

                message:
                    `${doctorName} has accepted your appointment request.`,

                type:
                    "appointment",

                data: {

                    appointmentId:
                        appointment._id.toString(),

                    doctorId:
                        doctor._id.toString(),

                    status:
                        "confirmed",

                },

            });


            console.log(
                "Patient appointment accepted notification sent."
            );


        } catch (notificationError) {

            console.error(
                "Accept notification failed:",
                notificationError.message
            );

        }


        // =================================================
        // POPULATE APPOINTMENT
        // =================================================

        const populatedAppointment =
            await Appointment.findById(
                appointment._id
            )

                .populate(
                    "patientId",
                    "firstName lastName email phone"
                )

                .populate(
                    "doctorId",
                    "firstName lastName email phone specialization specialty department profileImage image location city address"
                );


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "Appointment accepted successfully.",

            appointment:
                populatedAppointment,

        });


    } catch (error) {

        console.error(
            "Accept Appointment Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to accept appointment.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,

        });

    }

};


// =========================================================
// REJECT APPOINTMENT
// =========================================================

const rejectAppointment = async (req, res) => {

    try {

        const {
            appointmentId,
            doctorId,
        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (!appointmentId || !doctorId) {

            return res.status(400).json({

                success: false,

                message:
                    "Appointment ID and doctor ID are required.",

            });

        }


        // =================================================
        // FIND APPOINTMENT
        // =================================================

        const appointment =
            await Appointment.findOne({

                _id: appointmentId,

                doctorId: doctorId,

            });


        if (!appointment) {

            return res.status(404).json({

                success: false,

                message:
                    "Appointment not found.",

            });

        }


        // =================================================
        // CHECK STATUS
        // =================================================

        if (appointment.status !== "pending") {

            return res.status(400).json({

                success: false,

                message:
                    `Appointment cannot be rejected because its current status is ${appointment.status}.`,

            });

        }


        // =================================================
        // GET DOCTOR
        // =================================================

        const doctor =
            await User.findOne({

                _id: doctorId,

                role: "doctor",

            });


        if (!doctor) {

            return res.status(404).json({

                success: false,

                message:
                    "Doctor not found.",

            });

        }


        // =================================================
        // GET PATIENT
        // =================================================

        const patient =
            await User.findOne({

                _id: appointment.patientId,

                role: "patient",

            });


        if (!patient) {

            return res.status(404).json({

                success: false,

                message:
                    "Patient not found.",

            });

        }


        // =================================================
        // UPDATE STATUS
        // =================================================

        appointment.status =
            "rejected";


        await appointment.save();


        console.log(
            "APPOINTMENT REJECTED:",
            appointment._id
        );


        // =================================================
        // DOCTOR NAME
        // =================================================

        const doctorName =
            `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`
                .replace(/\s+/g, " ")
                .trim();


        // =================================================
        // NOTIFY PATIENT
        // =================================================

        try {

            await sendNotification({

                userId:
                    patient._id.toString(),

                title:
                    "Appointment Rejected",

                message:
                    `${doctorName} has rejected your appointment request.`,

                type:
                    "appointment",

                data: {

                    appointmentId:
                        appointment._id.toString(),

                    doctorId:
                        doctor._id.toString(),

                    status:
                        "rejected",

                },

            });


            console.log(
                "Patient appointment rejected notification sent."
            );


        } catch (notificationError) {

            console.error(
                "Reject notification failed:",
                notificationError.message
            );

        }


        // =================================================
        // POPULATE APPOINTMENT
        // =================================================

        const populatedAppointment =
            await Appointment.findById(
                appointment._id
            )

                .populate(
                    "patientId",
                    "firstName lastName email phone"
                )

                .populate(
                    "doctorId",
                    "firstName lastName email phone specialization specialty department profileImage image location city address"
                );


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "Appointment rejected successfully.",

            appointment:
                populatedAppointment,

        });


    } catch (error) {

        console.error(
            "Reject Appointment Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to reject appointment.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,

        });

    }

};








// =========================================================
// START / JOIN VIDEO CALL
// =========================================================

const startAppointmentCall = async (req, res) => {
    try {
        const {
            appointmentId,
            userId,
        } = req.body;

        // =================================================
        // VALIDATION
        // =================================================

        if (!appointmentId || !userId) {
            return res.status(400).json({
                success: false,
                message:
                    "Appointment ID and user ID are required.",
            });
        }

        // =================================================
        // FIND APPOINTMENT
        // =================================================

        const appointment =
            await Appointment.findById(
                appointmentId
            );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message:
                    "Appointment not found.",
            });
        }

        // =================================================
        // CHECK USER
        // Only patient or doctor can join
        // =================================================

        const isPatient =
            appointment.patientId.toString() ===
            userId.toString();

        const isDoctor =
            appointment.doctorId.toString() ===
            userId.toString();

        if (!isPatient && !isDoctor) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to join this call.",
            });
        }

        // =================================================
        // CHECK APPOINTMENT STATUS
        // =================================================

        if (
            appointment.status !==
            "confirmed"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Video call is available only for confirmed appointments.",
            });
        }

        // =================================================
        // CREATE ROOM ID IF NOT EXISTS
        // =================================================

        if (!appointment.callRoomId) {
            appointment.callRoomId =
                `healthcom-${appointment._id.toString()}`;

            appointment.callStartedAt =
                new Date();

            await appointment.save();
        }

        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,

            message:
                "Video call room ready.",

            appointmentId:
                appointment._id,

            roomId:
                appointment.callRoomId,

            callStartedAt:
                appointment.callStartedAt,
        });

    } catch (error) {

        console.error(
            "Start Appointment Call Error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to start video call.",

            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined,
        });
    }
};


// =========================================================
// GET VIDEO CALL ROOM
// =========================================================

const getAppointmentCall = async (
    req,
    res
) => {

    try {

        const {
            appointmentId,
        } = req.params;

        const {
            userId,
        } = req.query;

        // =================================================
        // VALIDATION
        // =================================================

        if (!appointmentId || !userId) {

            return res.status(400).json({
                success: false,

                message:
                    "Appointment ID and user ID are required.",
            });
        }

        // =================================================
        // FIND APPOINTMENT
        // =================================================

        const appointment =
            await Appointment.findById(
                appointmentId
            );

        if (!appointment) {

            return res.status(404).json({
                success: false,

                message:
                    "Appointment not found.",
            });
        }

        // =================================================
        // CHECK PARTICIPANT
        // =================================================

        const isPatient =
            appointment.patientId.toString() ===
            userId.toString();

        const isDoctor =
            appointment.doctorId.toString() ===
            userId.toString();

        if (!isPatient && !isDoctor) {

            return res.status(403).json({
                success: false,

                message:
                    "You are not allowed to access this call.",
            });
        }

        // =================================================
        // CHECK STATUS
        // =================================================

        if (
            appointment.status !==
            "confirmed"
        ) {

            return res.status(400).json({
                success: false,

                message:
                    "Video call is available only for confirmed appointments.",
            });
        }

        // =================================================
        // ROOM DOES NOT EXIST
        // =================================================

        if (!appointment.callRoomId) {

            return res.status(404).json({
                success: false,

                message:
                    "Video call room has not been created yet.",
            });
        }

        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            appointmentId:
                appointment._id,

            roomId:
                appointment.callRoomId,

            callStartedAt:
                appointment.callStartedAt,

        });

    } catch (error) {

        console.error(
            "Get Appointment Call Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to get video call room.",

            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined,
        });
    }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

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

};