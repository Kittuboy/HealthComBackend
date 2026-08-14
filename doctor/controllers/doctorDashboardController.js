const mongoose = require("mongoose");

const User = require("../../models/User");
const Appointment = require("../../models/Appointment");

const {
    sendPatientAppointmentAcceptedEmail,
    sendPatientAppointmentRejectedEmail,
} = require("../../services/emailService");

const {
    sendNotification,
} = require("../../services/notificationService");

// =========================================================
// DOCTOR DASHBOARD
// =========================================================

const getDoctorDashboard = async (req, res) => {
    try {
        // =====================================================
        // DOCTOR ID
        // =====================================================

        const doctorId = req.user?.id;

        console.log("====================================");
        console.log("🩺 Doctor Dashboard");
        console.log("Doctor ID:", doctorId);
        console.log("Current Date:", new Date());
        console.log("====================================");

        // =====================================================
        // VALIDATE DOCTOR ID
        // =====================================================

        if (!doctorId) {
            return res.status(401).json({
                success: false,
                message: "Doctor authentication required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID.",
            });
        }

        // =====================================================
        // CHECK DOCTOR
        // =====================================================

        const doctor = await User.findOne({
            _id: doctorId,
            role: "doctor",
        })
            .select(
                "firstName lastName email phone specialization specialty department profileImage image isVerified"
            )
            .lean();

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        // =====================================================
        // DATE RANGE
        // =====================================================

        const now = new Date();

        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        // =====================================================
        // BASE DOCTOR QUERY
        // =====================================================

        const doctorQuery = {
            doctorId: doctorId,
        };

        // =====================================================
        // TODAY'S APPOINTMENTS
        //
        // Only appointments having actual date
        // =====================================================

        const todayAppointments =
            await Appointment.countDocuments({
                doctorId: doctorId,

                appointmentDate: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },

                status: {
                    $nin: [
                        "cancelled",
                        "rejected",
                    ],
                },
            });

        // =====================================================
        // TOTAL UNIQUE PATIENTS
        // =====================================================

        const patientIds =
            await Appointment.distinct(
                "patientId",
                {
                    doctorId: doctorId,
                }
            );

        const totalPatients =
            patientIds.length;

        // =====================================================
        // PENDING CONSULTATIONS
        // =====================================================

        const pendingConsultations =
            await Appointment.countDocuments({
                doctorId: doctorId,
                status: "pending",
            });

        // =====================================================
        // ALL ACTIVE APPOINTMENTS
        //
        // IMPORTANT:
        //
        // We DO NOT require appointmentDate here.
        //
        // Because current booking flow creates:
        //
        // appointmentDate = null
        // appointmentTime = ""
        //
        // Doctor still needs to see the request.
        // =====================================================

        const upcomingAppointments =
            await Appointment.find({
                doctorId: doctorId,

                status: {
                    $nin: [
                        "cancelled",
                        "rejected",
                        "completed",
                    ],
                },
            })
                .populate(
                    "patientId",
                    "firstName lastName email phone"
                )
                .sort({
                    appointmentDate: 1,
                    createdAt: -1,
                })
                .limit(10)
                .lean();

        console.log(
            "📅 Upcoming/Active appointments found:",
            upcomingAppointments.length
        );

        // =====================================================
        // DEBUG
        // =====================================================

        console.log(
            "📋 Doctor appointments:"
        );

        upcomingAppointments.forEach(
            (appointment, index) => {
                console.log(
                    `Appointment ${index + 1}:`
                );

                console.log(
                    "ID:",
                    appointment._id
                );

                console.log(
                    "Doctor ID:",
                    appointment.doctorId
                );

                console.log(
                    "Patient ID:",
                    appointment.patientId?._id
                );

                console.log(
                    "Patient:",
                    appointment.patientId?.firstName,
                    appointment.patientId?.lastName
                );

                console.log(
                    "Date:",
                    appointment.appointmentDate
                );

                console.log(
                    "Time:",
                    appointment.appointmentTime
                );

                console.log(
                    "Status:",
                    appointment.status
                );

                console.log("------------------------------------");
            }
        );

        // =====================================================
        // RECENT APPOINTMENTS
        // =====================================================

        const recentAppointments =
            await Appointment.find({
                doctorId: doctorId,
            })
                .populate(
                    "patientId",
                    "firstName lastName email phone"
                )
                .sort({
                    createdAt: -1,
                })
                .limit(20)
                .lean();

        // =====================================================
        // UNIQUE RECENT PATIENTS
        // =====================================================

        const recentPatientsMap =
            new Map();

        for (
            const appointment
            of recentAppointments
        ) {
            const patient =
                appointment.patientId;

            if (!patient?._id) {
                continue;
            }

            const patientKey =
                patient._id.toString();

            if (
                !recentPatientsMap.has(
                    patientKey
                )
            ) {
                recentPatientsMap.set(
                    patientKey,
                    {
                        _id: patient._id,

                        firstName:
                            patient.firstName ||
                            "",

                        lastName:
                            patient.lastName ||
                            "",

                        email:
                            patient.email ||
                            "",

                        phone:
                            patient.phone ||
                            "",

                        lastVisit:
                            appointment.appointmentDate
                                ? new Date(
                                    appointment.appointmentDate
                                ).toLocaleDateString(
                                    "en-IN",
                                    {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    }
                                )
                                : "Appointment request",
                    }
                );
            }
        }

        const recentPatients =
            Array.from(
                recentPatientsMap.values()
            ).slice(0, 5);

        // =====================================================
        // FORMAT UPCOMING APPOINTMENTS
        // =====================================================

        const formattedAppointments =
            upcomingAppointments.map(
                (appointment) => {
                    let formattedDate =
                        "To be scheduled";

                    if (
                        appointment.appointmentDate
                    ) {
                        formattedDate =
                            new Date(
                                appointment.appointmentDate
                            ).toLocaleDateString(
                                "en-IN",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                }
                            );
                    }

                    let formattedTime =
                        "To be scheduled";

                    if (
                        appointment.appointmentTime
                    ) {
                        formattedTime =
                            appointment.appointmentTime;
                    }

                    const patient =
                        appointment.patientId;

                    return {
                        _id:
                            appointment._id,

                        date:
                            formattedDate,

                        time:
                            formattedTime,

                        patient: {
                            _id:
                                patient?._id ||
                                null,

                            firstName:
                                patient?.firstName ||
                                "",

                            lastName:
                                patient?.lastName ||
                                "",

                            email:
                                patient?.email ||
                                "",

                            phone:
                                patient?.phone ||
                                "",
                        },

                        type:
                            appointment.callRoomId
                                ? "Online"
                                : "Consultation",

                        status:
                            appointment.status ||
                            "pending",

                        callRoomId:
                            appointment.callRoomId ||
                            null,

                        appointmentDate:
                            appointment.appointmentDate ||
                            null,

                        appointmentTime:
                            appointment.appointmentTime ||
                            "",

                        createdAt:
                            appointment.createdAt,
                    };
                }
            );

        // =====================================================
        // TODAY SCHEDULE
        //
        // Generate schedule from today's appointments
        // =====================================================

        const todayScheduleAppointments =
            await Appointment.find({
                doctorId: doctorId,

                appointmentDate: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },

                status: {
                    $nin: [
                        "cancelled",
                        "rejected",
                        "completed",
                    ],
                },
            })
                .populate(
                    "patientId",
                    "firstName lastName"
                )
                .sort({
                    appointmentTime: 1,
                })
                .limit(10)
                .lean();

        const schedule =
            todayScheduleAppointments.map(
                (appointment) => ({
                    time:
                        appointment.appointmentTime ||
                        "Time not specified",

                    title:
                        appointment.patientId
                            ? `${appointment.patientId.firstName || ""} ${appointment.patientId.lastName || ""
                                }`.trim()
                            : "Patient consultation",

                    duration:
                        "Consultation",
                })
            );

        // =====================================================
        // NOTIFICATIONS
        //
        // For now create useful dashboard notifications
        // from pending appointments.
        // =====================================================

        const pendingAppointments =
            upcomingAppointments.filter(
                (appointment) =>
                    appointment.status ===
                    "pending"
            );

        const notifications =
            pendingAppointments
                .slice(0, 5)
                .map((appointment) => {
                    const patient =
                        appointment.patientId;

                    const patientName =
                        `${patient?.firstName || ""} ${patient?.lastName || ""
                            }`
                            .replace(/\s+/g, " ")
                            .trim() ||
                        "Patient";

                    return {
                        _id:
                            appointment._id,

                        title:
                            "New Appointment Request",

                        message:
                            `${patientName} has requested an appointment with you.`,

                        type:
                            "appointment",

                        time:
                            appointment.createdAt
                                ? new Date(
                                    appointment.createdAt
                                ).toLocaleString(
                                    "en-IN",
                                    {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }
                                )
                                : "Recently",
                    };
                });

        // =====================================================
        // PROFILE COMPLETION
        // =====================================================

        const profileFields = [
            doctor.firstName,
            doctor.lastName,
            doctor.email,
            doctor.phone,
            doctor.specialization ||
            doctor.specialty ||
            doctor.department,
            doctor.profileImage ||
            doctor.image,
        ];

        const completedProfileFields =
            profileFields.filter(
                Boolean
            ).length;

        const profileCompletion =
            Math.round(
                (completedProfileFields /
                    profileFields.length) *
                100
            );

        // =====================================================
        // SUBSCRIPTION
        //
        // Temporary static values until subscription model
        // is connected.
        // =====================================================

        const subscription = {
            name: "Free Plan",

            status: "active",

            used:
                pendingConsultations,

            limit: 10,
        };

        // =====================================================
        // FINAL RESPONSE
        // =====================================================

        return res.status(200).json({
            success: true,

            data: {
                // =============================================
                // PROFILE
                // =============================================

                doctor: {
                    _id: doctor._id,

                    firstName:
                        doctor.firstName || "",

                    lastName:
                        doctor.lastName || "",

                    email:
                        doctor.email || "",

                    specialization:
                        doctor.specialization ||
                        doctor.specialty ||
                        doctor.department ||
                        "General Physician",

                    profileImage:
                        doctor.profileImage ||
                        doctor.image ||
                        null,
                },

                // =============================================
                // STATS
                // =============================================

                stats: {
                    todayAppointments,

                    totalPatients,

                    todayEarnings: 0,

                    pendingConsultations,
                },

                // =============================================
                // APPOINTMENTS
                // =============================================

                upcomingAppointments:
                    formattedAppointments,

                // =============================================
                // PATIENTS
                // =============================================

                recentPatients,

                // =============================================
                // SCHEDULE
                // =============================================

                schedule,

                // =============================================
                // NOTIFICATIONS
                // =============================================

                notifications,

                // =============================================
                // PROFILE STATUS
                // =============================================

                profile: {
                    completion:
                        profileCompletion,

                    verified:
                        doctor.isVerified === true,
                },

                // =============================================
                // SUBSCRIPTION
                // =============================================

                subscription,
            },
        });
    } catch (error) {
        console.error(
            "❌ Doctor Dashboard Error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to load doctor dashboard",

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

// =========================================================
// DOCTOR ACCEPT APPOINTMENT
// =========================================================

const acceptAppointment = async (req, res) => {
    try {

        const doctorId = req.user?.id;
        const { appointmentId } = req.body;

        console.log("====================================");
        console.log("🩺 ACCEPT APPOINTMENT");
        console.log("Doctor ID:", doctorId);
        console.log("Appointment ID:", appointmentId);
        console.log("====================================");


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!doctorId) {
            return res.status(401).json({
                success: false,
                message: "Doctor authentication required.",
            });
        }

        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID is required.",
            });
        }


        // =====================================================
        // VALIDATE IDS
        // =====================================================

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID.",
            });
        }


        // =====================================================
        // FIND APPOINTMENT
        // =====================================================

        const appointment =
            await Appointment.findOne({
                _id: appointmentId,
                doctorId: doctorId,
            });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }


        // =====================================================
        // CHECK STATUS
        // =====================================================

        if (appointment.status !== "pending") {
            return res.status(400).json({
                success: false,
                message:
                    `Appointment cannot be accepted because its current status is ${appointment.status}.`,
            });
        }


        // =====================================================
        // GET DOCTOR
        // =====================================================

        const doctor =
            await User.findOne({
                _id: doctorId,
                role: "doctor",
            });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }


        // =====================================================
        // GET PATIENT
        // =====================================================

        const patient =
            await User.findOne({
                _id: appointment.patientId,
                role: "patient",
            });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found.",
            });
        }


        // =====================================================
        // UPDATE STATUS
        // =====================================================

        appointment.status = "confirmed";

        await appointment.save();

        console.log(
            "✅ APPOINTMENT ACCEPTED:",
            appointment._id
        );


        // =====================================================
        // DOCTOR NAME
        // =====================================================

        const doctorName =
            `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`
                .replace(/\s+/g, " ")
                .trim();


        // =====================================================
        // SPECIALIZATION
        // =====================================================

        const specialty =
            doctor.specialization ||
            doctor.specialty ||
            doctor.department ||
            "General Physician";


        // =====================================================
        // APPOINTMENT DATE
        // =====================================================

        const appointmentDate =
            appointment.appointmentDate
                ? new Date(
                    appointment.appointmentDate
                ).toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    }
                )
                : "To be scheduled";


        // =====================================================
        // APPOINTMENT TIME
        // =====================================================

        const appointmentTime =
            appointment.appointmentTime ||
            "To be scheduled";


        // =====================================================
        // SEND ACCEPTANCE EMAIL
        // =====================================================

        try {

            await sendPatientAppointmentAcceptedEmail({

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
                "✅ Acceptance email sent:",
                patient.email
            );

        } catch (emailError) {

            console.error(
                "❌ Acceptance email failed:",
                emailError.message
            );

        }


        // =====================================================
        // PATIENT NOTIFICATION
        // =====================================================

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
                "✅ Patient notification sent."
            );

        } catch (notificationError) {

            console.error(
                "❌ Notification failed:",
                notificationError.message
            );

        }


        // =====================================================
        // POPULATE
        // =====================================================

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
                    "firstName lastName email phone specialization specialty department profileImage image"
                );


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            message:
                "Appointment accepted successfully.",

            appointment:
                populatedAppointment,

        });

    } catch (error) {

        console.error(
            "❌ Accept Appointment Error:",
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

// =========================================================
// DOCTOR REJECT APPOINTMENT
// =========================================================

const rejectAppointment = async (req, res) => {
    try {

        const doctorId = req.user?.id;
        const { appointmentId } = req.body;


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!doctorId) {
            return res.status(401).json({
                success: false,
                message: "Doctor authentication required.",
            });
        }

        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID is required.",
            });
        }


        // =====================================================
        // FIND APPOINTMENT
        // =====================================================

        const appointment =
            await Appointment.findOne({
                _id: appointmentId,
                doctorId: doctorId,
            });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }


        // =====================================================
        // CHECK STATUS
        // =====================================================

        if (appointment.status !== "pending") {
            return res.status(400).json({
                success: false,
                message:
                    `Appointment cannot be rejected because its current status is ${appointment.status}.`,
            });
        }


        // =====================================================
        // GET DOCTOR
        // =====================================================

        const doctor =
            await User.findOne({
                _id: doctorId,
                role: "doctor",
            });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }


        // =====================================================
        // GET PATIENT
        // =====================================================

        const patient =
            await User.findOne({
                _id: appointment.patientId,
                role: "patient",
            });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found.",
            });
        }


        // =====================================================
        // UPDATE STATUS
        // =====================================================

        appointment.status = "rejected";

        await appointment.save();

        console.log(
            "❌ APPOINTMENT REJECTED:",
            appointment._id
        );


        // =====================================================
        // DOCTOR NAME
        // =====================================================

        const doctorName =
            `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`
                .replace(/\s+/g, " ")
                .trim();


        // =====================================================
        // SPECIALIZATION
        // =====================================================

        const specialty =
            doctor.specialization ||
            doctor.specialty ||
            doctor.department ||
            "General Physician";


        // =====================================================
        // APPOINTMENT DATE
        // =====================================================

        const appointmentDate =
            appointment.appointmentDate
                ? new Date(
                    appointment.appointmentDate
                ).toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    }
                )
                : "To be scheduled";


        // =====================================================
        // APPOINTMENT TIME
        // =====================================================

        const appointmentTime =
            appointment.appointmentTime ||
            "To be scheduled";


        // =====================================================
        // SEND REJECTION EMAIL
        // =====================================================

        try {

            await sendPatientAppointmentRejectedEmail({

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
                "✅ Rejection email sent:",
                patient.email
            );

        } catch (emailError) {

            console.error(
                "❌ Rejection email failed:",
                emailError.message
            );

        }


        // =====================================================
        // PATIENT NOTIFICATION
        // =====================================================

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
                "✅ Patient rejection notification sent."
            );

        } catch (notificationError) {

            console.error(
                "❌ Rejection notification failed:",
                notificationError.message
            );

        }


        // =====================================================
        // POPULATE
        // =====================================================

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
                    "firstName lastName email phone specialization specialty department profileImage image"
                );


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            message:
                "Appointment rejected successfully.",

            appointment:
                populatedAppointment,

        });

    } catch (error) {

        console.error(
            "❌ Reject Appointment Error:",
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
// EXPORT
// =========================================================

module.exports = {
    getDoctorDashboard,
    acceptAppointment,
    rejectAppointment,
};