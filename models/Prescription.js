const mongoose = require("mongoose");


// =========================================================
// PRESCRIPTION MEDICINE
// =========================================================

const prescriptionMedicineSchema =
    new mongoose.Schema(
        {
            name: {
                type: String,
                required: true,
                trim: true,
            },

            type: {
                type: String,
                default: "Medicine",
                trim: true,
            },

            dosage: {
                type: String,
                required: true,
                trim: true,
            },

            frequency: {
                type: String,
                required: true,
                trim: true,
            },

            duration: {
                type: String,
                required: true,
                trim: true,
            },

            instructions: {
                type: String,
                default: "",
                trim: true,
            },
        },
        {
            _id: true,
        }
    );


// =========================================================
// PRESCRIPTION
// =========================================================

const prescriptionSchema =
    new mongoose.Schema(
        {
            appointmentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Appointment",
                required: true,
            },

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

            diagnosis: {
                type: String,
                default: "",
                trim: true,
            },

            medicines: {
                type: [
                    prescriptionMedicineSchema,
                ],

                required: true,

                validate: {
                    validator: function (value) {
                        return (
                            Array.isArray(value) &&
                            value.length > 0
                        );
                    },

                    message:
                        "At least one medicine is required.",
                },
            },

            additionalInstructions: {
                type: String,
                default: "",
                trim: true,
            },

            followUpDate: {
                type: Date,
                default: null,
            },

            status: {
                type: String,

                enum: [
                    "Active",
                    "Completed",
                    "Cancelled",
                ],

                default: "Active",
            },

            cancelledAt: {
                type: Date,
                default: null,
            },

            completedAt: {
                type: Date,
                default: null,
            },
        },

        {
            timestamps: true,
        }
    );


// =========================================================
// INDEXES
// =========================================================

prescriptionSchema.index({
    patientId: 1,
    createdAt: -1,
});

prescriptionSchema.index({
    doctorId: 1,
    createdAt: -1,
});

prescriptionSchema.index({
    appointmentId: 1,
});


// =========================================================
// HELPER
// =========================================================

function extractDurationInDays(duration) {

    if (!duration) {
        return 0;
    }

    const value =
        String(duration)
            .toLowerCase()
            .trim();

    // Example:
    // "5 days"
    // "5 day"
    // "5d"

    const dayMatch =
        value.match(
            /(\d+(?:\.\d+)?)\s*(?:days?|d)\b/
        );

    if (dayMatch) {

        return Math.ceil(
            Number(dayMatch[1])
        );

    }


    // Example:
    // "2 weeks"
    // "2 week"
    // "2w"

    const weekMatch =
        value.match(
            /(\d+(?:\.\d+)?)\s*(?:weeks?|w)\b/
        );

    if (weekMatch) {

        return Math.ceil(
            Number(weekMatch[1]) * 7
        );

    }


    // Example:
    // "1 month"
    // "1 months"
    // "1m"

    const monthMatch =
        value.match(
            /(\d+(?:\.\d+)?)\s*(?:months?|m)\b/
        );

    if (monthMatch) {

        return Math.ceil(
            Number(monthMatch[1]) * 30
        );

    }


    return 0;
}


// =========================================================
// CALCULATE STATUS
// =========================================================

prescriptionSchema.methods.calculateStatus =
    function () {

        // -----------------------------------------------
        // Cancelled stays cancelled
        // -----------------------------------------------

        if (
            this.status === "Cancelled"
        ) {

            return "Cancelled";

        }


        const createdAt =
            new Date(
                this.createdAt
            );


        let completionDate =
            null;


        // -----------------------------------------------
        // MEDICINE DURATION
        // -----------------------------------------------

        if (
            Array.isArray(
                this.medicines
            ) &&
            this.medicines.length > 0
        ) {

            let maximumDays = 0;


            this.medicines.forEach(
                (medicine) => {

                    const days =
                        extractDurationInDays(
                            medicine.duration
                        );


                    if (
                        days >
                        maximumDays
                    ) {

                        maximumDays =
                            days;

                    }

                }
            );


            if (
                maximumDays > 0
            ) {

                completionDate =
                    new Date(
                        createdAt
                    );

                completionDate.setDate(
                    completionDate.getDate() +
                    maximumDays
                );

            }

        }


        // -----------------------------------------------
        // FOLLOW-UP DATE
        // -----------------------------------------------

        if (
            this.followUpDate
        ) {

            const followUp =
                new Date(
                    this.followUpDate
                );


            if (
                !completionDate ||
                followUp > completionDate
            ) {

                completionDate =
                    followUp;

            }

        }


        // -----------------------------------------------
        // NO DATE = ACTIVE
        // -----------------------------------------------

        if (
            !completionDate
        ) {

            return "Active";

        }


        // -----------------------------------------------
        // DATE PASSED = COMPLETED
        // -----------------------------------------------

        const now =
            new Date();


        if (
            now >= completionDate
        ) {

            return "Completed";

        }


        return "Active";

    };


// =========================================================
// EXPORT
// =========================================================

module.exports =
    mongoose.model(
        "Prescription",
        prescriptionSchema
    );