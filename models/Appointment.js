const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        appointmentDate: {
            type: Date,
            // default: null,
        },

        appointmentTime: {
            type: String,
            default: "",
        },

        status: {
            type: String,

            enum: [
                "pending",
                "confirmed",
                "completed",
                "cancelled",
                "rejected",
            ],

            default: "pending",
        },

        // =================================================
        // VIDEO CALL
        // =================================================

        callRoomId: {
            type: String,
            default: null,
        },

        callStartedAt: {
            type: Date,
            default: null,
        },

        callEndedAt: {
            type: Date,
            default: null,
        },
    },

    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "Appointment",
    appointmentSchema
);