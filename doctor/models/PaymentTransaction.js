const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DoctorSubscription",
            default: null,
        },

        planId: {
            type: String,
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        transactionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        easebuzzTransactionId: {
            type: String,
            default: null,
        },

        status: {
            type: String,
            enum: [
                "created",
                "pending",
                "success",
                "failed",
                "cancelled",
            ],
            default: "created",
        },

        paymentResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        paidAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "PaymentTransaction",
    paymentTransactionSchema
);