const mongoose = require("mongoose");

const Appointment =
    require("../models/Appointment");


// =========================================================
// CREATE / JOIN CALL
// POST /api/calls/create
// =========================================================

const createCall = async (req, res) => {

    try {

        // -------------------------------------------------
        // AUTHENTICATED USER
        // -------------------------------------------------

        const userId =
            req.user?._id;


        const {
            appointmentId
        } = req.body;


        console.log("");
        console.log("======================================");
        console.log("        CREATE / JOIN CALL");
        console.log("======================================");

        console.log(
            "Appointment ID:",
            appointmentId
        );

        console.log(
            "User ID:",
            userId
        );


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!appointmentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Appointment ID is required."

            });

        }


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }


        // -------------------------------------------------
        // CHECK OBJECT ID
        // -------------------------------------------------

        if (
            !mongoose.Types.ObjectId.isValid(
                appointmentId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid appointment ID."

            });

        }


        // -------------------------------------------------
        // FIND APPOINTMENT
        // -------------------------------------------------

        const appointment =
            await Appointment.findById(
                appointmentId
            );


        if (!appointment) {

            return res.status(404).json({

                success: false,

                message:
                    "Appointment not found."

            });

        }


        console.log(
            "Appointment found:",
            appointment._id.toString()
        );


        // -------------------------------------------------
        // CHECK APPOINTMENT STATUS
        // -------------------------------------------------

        if (
            appointment.status !==
            "confirmed"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Video call is available only for confirmed appointments."

            });

        }


        // -------------------------------------------------
        // PATIENT / DOCTOR ID
        // -------------------------------------------------

        const patientId =
            appointment.patientId?.toString();


        const doctorId =
            appointment.doctorId?.toString();


        const currentUserId =
            userId.toString();


        const isPatient =
            patientId === currentUserId;


        const isDoctor =
            doctorId === currentUserId;


        console.log(
            "Patient ID:",
            patientId
        );

        console.log(
            "Doctor ID:",
            doctorId
        );

        console.log(
            "Current User:",
            currentUserId
        );

        console.log(
            "Is Patient:",
            isPatient
        );

        console.log(
            "Is Doctor:",
            isDoctor
        );


        // -------------------------------------------------
        // AUTHORIZATION
        // -------------------------------------------------

        if (
            !isPatient &&
            !isDoctor
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to join this appointment."

            });

        }


        // =================================================
        // IMPORTANT
        // SAME ROOM FOR PATIENT + DOCTOR
        // =================================================

        if (
            !appointment.callRoomId
        ) {

            appointment.callRoomId =
                appointment._id.toString();

        }


        // -------------------------------------------------
        // START TIME
        // -------------------------------------------------

        if (
            !appointment.callStartedAt
        ) {

            appointment.callStartedAt =
                new Date();

        }


        await appointment.save();


        // -------------------------------------------------
        // ROLE
        // -------------------------------------------------

        const role =
            isDoctor
                ? "doctor"
                : "patient";


        // -------------------------------------------------
        // SAME ROOM ID
        // -------------------------------------------------

        const roomId =
            appointment.callRoomId;


        console.log(
            "Room ID:",
            roomId
        );

        console.log(
            "Role:",
            role
        );

        console.log(
            "======================================"
        );


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Video call ready.",

            call: {

                appointmentId:
                    appointment._id.toString(),

                roomId:
                    roomId,

                userId:
                    currentUserId,

                role:
                    role,

                callStartedAt:
                    appointment.callStartedAt

            }

        });

    }
    catch (error) {

        console.error("");
        console.error(
            "======================================"
        );

        console.error(
            "CREATE CALL ERROR"
        );

        console.error(error);

        console.error(
            "======================================"
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to start call.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined

        });

    }

};



// =========================================================
// GET CALL
// GET /api/calls/:appointmentId
// =========================================================

const getCall = async (req, res) => {

    try {

        const {
            appointmentId
        } = req.params;


        const userId =
            req.user?._id;


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }


        if (
            !mongoose.Types.ObjectId.isValid(
                appointmentId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid appointment ID."

            });

        }


        const appointment =
            await Appointment.findById(
                appointmentId
            );


        if (!appointment) {

            return res.status(404).json({

                success: false,

                message:
                    "Appointment not found."

            });

        }


        const currentUserId =
            userId.toString();


        const patientId =
            appointment.patientId?.toString();


        const doctorId =
            appointment.doctorId?.toString();


        if (
            currentUserId !== patientId &&
            currentUserId !== doctorId
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to access this call."

            });

        }


        return res.status(200).json({

            success: true,

            call: {

                appointmentId:
                    appointment._id.toString(),

                roomId:
                    appointment.callRoomId ||
                    appointment._id.toString(),

                callStartedAt:
                    appointment.callStartedAt,

                callEndedAt:
                    appointment.callEndedAt

            }

        });

    }
    catch (error) {

        console.error(
            "GET CALL ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to get call.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined

        });

    }

};



// =========================================================
// END CALL
// POST /api/calls/end
// =========================================================

const endCall = async (req, res) => {

    try {

        const {
            appointmentId
        } = req.body;


        const userId =
            req.user?._id;


        if (!appointmentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Appointment ID is required."

            });

        }


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }


        if (
            !mongoose.Types.ObjectId.isValid(
                appointmentId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid appointment ID."

            });

        }


        const appointment =
            await Appointment.findById(
                appointmentId
            );


        if (!appointment) {

            return res.status(404).json({

                success: false,

                message:
                    "Appointment not found."

            });

        }


        const currentUserId =
            userId.toString();


        const patientId =
            appointment.patientId?.toString();


        const doctorId =
            appointment.doctorId?.toString();


        if (
            currentUserId !== patientId &&
            currentUserId !== doctorId
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to end this call."

            });

        }


        appointment.callEndedAt =
            new Date();


        await appointment.save();


        return res.status(200).json({

            success: true,

            message:
                "Call ended successfully."

        });

    }
    catch (error) {

        console.error(
            "END CALL ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to end call."

        });

    }

};



module.exports = {

    createCall,

    getCall,

    endCall

};