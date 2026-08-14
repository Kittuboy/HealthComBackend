const mongoose = require("mongoose");

const doctorSubscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        planId: {
            type: String,
            enum: [
                "free",
                "basic",
                "professional",
            ],
            default: "free",
        },

        planName: {
            type: String,
            default: "Free",
        },

        status: {
            type: String,
            enum: [
                "active",
                "expired",
                "cancelled",
                "pending",
            ],
            default: "active",
        },

        price: {
            type: Number,
            default: 0,
        },

        startDate: {
            type: Date,
            default: Date.now,
        },

        endDate: {
            type: Date,
            default: null,
        },

        features: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        autoRenew: {
            type: Boolean,
            default: false,
        },

        lastTransactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentTransaction",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "DoctorSubscription",
    doctorSubscriptionSchema
);