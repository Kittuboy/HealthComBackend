const Prescription =
    require("../models/Prescription");

const Appointment =
    require("../models/Appointment");


// =========================================================
// CREATE PRESCRIPTION
// =========================================================

const createPrescription =
    async (req, res) => {

        try {

            const {
                appointmentId,
                patientId,
                diagnosis,
                medicines,
                additionalInstructions,
                followUpDate,
            } = req.body;


            // =================================================
            // VALIDATION
            // =================================================

            if (!appointmentId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Appointment ID is required.",
                });

            }


            if (!patientId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Patient ID is required.",
                });

            }


            if (
                !Array.isArray(medicines) ||
                medicines.length === 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "At least one medicine is required.",
                });

            }


            // =================================================
            // DOCTOR ID
            // =================================================

            const doctorId =
                req.user?.id ||
                req.user?._id;


            if (!doctorId) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Doctor authentication required.",
                });

            }


            // =================================================
            // GET APPOINTMENT
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
            // APPOINTMENT STATUS CHECK
            // =================================================

            if (appointment.status !== "confirmed") {

                return res.status(400).json({

                    success: false,

                    message:
                        `Prescription can only be created for a confirmed appointment. Current status: ${appointment.status}`,

                });

            }


            console.log("=================================");
            console.log("PRESCRIPTION AUTH DEBUG");
            console.log("Token Doctor ID:", doctorId);
            console.log("Appointment Doctor ID:", appointment.doctorId);
            console.log("Appointment Patient ID:", appointment.patientId);
            console.log("Request Patient ID:", patientId);
            console.log("=================================");

            // =================================================
            // SECURITY
            // =================================================

            if (
                String(appointment.doctorId) !==
                String(doctorId)
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized for this appointment.",
                });

            }


            if (
                String(appointment.patientId) !==
                String(patientId)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Patient does not belong to this appointment.",
                });

            }


            // =================================================
            // CREATE
            // =================================================

            const prescription =
                await Prescription.create({

                    appointmentId,

                    patientId,

                    doctorId,

                    diagnosis:
                        diagnosis || "",

                    medicines,

                    additionalInstructions:
                        additionalInstructions || "",

                    followUpDate:
                        followUpDate || null,

                    status: "Active",

                });


            // =================================================
            // POPULATE
            // =================================================

            const populatedPrescription =
                await Prescription
                    .findById(
                        prescription._id
                    )
                    .populate(
                        "doctorId",
                        "firstName lastName email"
                    )
                    .populate(
                        "patientId",
                        "firstName lastName email"
                    );


            // =================================================
            // REAL-TIME SOCKET EVENT
            // =================================================

            const io =
                req.app.get("io");


            if (io) {

                io.to(
                    `patient:${patientId}`
                ).emit(
                    "prescription-created",
                    {
                        prescription:
                            populatedPrescription,
                    }
                );

            }


            return res.status(201).json({

                success: true,

                message:
                    "Prescription created successfully.",

                prescription:
                    populatedPrescription,

            });

        } catch (error) {

            console.error(
                "CREATE PRESCRIPTION ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to create prescription.",

                error:
                    process.env.NODE_ENV ===
                        "development"
                        ? error.message
                        : undefined,

            });

        }

    };


// =========================================================
// GET PATIENT PRESCRIPTIONS
// =========================================================

const getPatientPrescriptions =
    async (req, res) => {

        try {

            const patientId =
                req.user?.id ||
                req.user?._id;


            if (!patientId) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required.",
                });

            }


            let prescriptions =
                await Prescription
                    .find({
                        patientId,
                    })
                    .populate(
                        "doctorId",
                        "firstName lastName email"
                    )
                    .populate(
                        "appointmentId"
                    )
                    .sort({
                        createdAt: -1,
                    });


            // =============================================
            // AUTOMATIC STATUS UPDATE
            // =============================================

            for (
                const prescription
                of prescriptions
            ) {

                await updatePrescriptionStatus(
                    prescription
                );

            }


            // =============================================
            // RELOAD UPDATED DATA
            // =============================================

            prescriptions =
                await Prescription
                    .find({
                        patientId,
                    })
                    .populate(
                        "doctorId",
                        "firstName lastName email"
                    )
                    .populate(
                        "appointmentId"
                    )
                    .sort({
                        createdAt: -1,
                    });


            return res.json({

                success: true,

                prescriptions,

            });

        } catch (error) {

            console.error(
                "GET PATIENT PRESCRIPTIONS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load prescriptions.",

            });

        }

    };


// =========================================================
// GET SINGLE PRESCRIPTION
// =========================================================

const getPrescriptionById =
    async (req, res) => {

        try {

            const {
                prescriptionId,
            } = req.params;


            const userId =
                req.user?.id ||
                req.user?._id;


            const prescription =
                await Prescription
                    .findById(
                        prescriptionId
                    )
                    .populate(
                        "doctorId",
                        "firstName lastName email"
                    )
                    .populate(
                        "patientId",
                        "firstName lastName email"
                    )
                    .populate(
                        "appointmentId"
                    );


            if (!prescription) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Prescription not found.",

                });

            }


            const isPatient =
                String(
                    prescription.patientId?._id
                ) === String(userId);


            const isDoctor =
                String(
                    prescription.doctorId?._id
                ) === String(userId);


            if (
                !isPatient &&
                !isDoctor
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You are not authorized to view this prescription.",

                });

            }


            return res.json({

                success: true,

                prescription,

            });

        } catch (error) {

            console.error(
                "GET PRESCRIPTION ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load prescription.",

            });

        }

    };


// ==================================================================
// Prescription Status
// ==================================================================

const updatePrescriptionStatus =
    async (prescription) => {

        if (
            !prescription ||
            prescription.status === "Cancelled"
        ) {

            return prescription;

        }


        const calculatedStatus =
            prescription.calculateStatus();


        if (
            calculatedStatus !==
            prescription.status
        ) {

            prescription.status =
                calculatedStatus;


            if (
                calculatedStatus ===
                "Completed"
            ) {

                prescription.completedAt =
                    new Date();

            }


            await prescription.save();

        }


        return prescription;

    };


module.exports = {

    createPrescription,

    getPatientPrescriptions,

    getPrescriptionById,

};