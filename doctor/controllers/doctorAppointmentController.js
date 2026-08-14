const Appointment = require("../../models/Appointment");


/*
====================================================
GET DOCTOR APPOINTMENTS
====================================================
GET /api/doctor/appointments
====================================================
*/

const getDoctorAppointments = async (req, res) => {

    try {

        const doctorId =
            req.user?._id;


        if (!doctorId) {

            return res.status(401).json({

                success: false,

                message:
                    "Doctor authentication required."

            });

        }


        console.log(
            "Doctor Appointments Request"
        );

        console.log(
            "Doctor ID:",
            doctorId
        );


        const appointments =
            await Appointment.find({
                doctorId: doctorId
            })
            .populate(
                "patientId",
                "firstName lastName email phone profileImage avatar gender dateOfBirth"
            )
            .sort({

                appointmentDate: 1,

                appointmentTime: 1

            })
            .lean();


        console.log(
            "Appointments Found:",
            appointments.length
        );


        return res.status(200).json({

            success: true,

            count:
                appointments.length,

            data:
                appointments

        });

    }
    catch (error) {

        console.error(
            "Get doctor appointments error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch doctor appointments.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined

        });

    }

};


/*
====================================================
GET SINGLE APPOINTMENT
====================================================
*/

const getDoctorAppointmentById = async (
    req,
    res
) => {

    try {

        const doctorId =
            req.user?._id;


        const {
            appointmentId
        } = req.params;


        if (!doctorId) {

            return res.status(401).json({

                success: false,

                message:
                    "Doctor authentication required."

            });

        }


        const appointment =
            await Appointment.findOne({

                _id:
                    appointmentId,

                doctorId:
                    doctorId

            })
            .populate(
                "patientId",
                "firstName lastName email phone profileImage avatar gender dateOfBirth"
            )
            .lean();


        if (!appointment) {

            return res.status(404).json({

                success: false,

                message:
                    "Appointment not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                appointment

        });

    }
    catch (error) {

        console.error(
            "Get appointment details error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch appointment details."

        });

    }

};


/*
====================================================
APPOINTMENT STATS
====================================================
*/

const getDoctorAppointmentStats = async (
    req,
    res
) => {

    try {

        const doctorId =
            req.user?._id;


        if (!doctorId) {

            return res.status(401).json({

                success: false,

                message:
                    "Doctor authentication required."

            });

        }


        const appointments =
            await Appointment.find({

                doctorId:
                    doctorId

            })
            .select(
                "appointmentDate status amount fee consultationFee paymentAmount"
            )
            .lean();


        const today =
            new Date();


        const startOfDay =
            new Date(

                today.getFullYear(),

                today.getMonth(),

                today.getDate()

            );


        const endOfDay =
            new Date(

                today.getFullYear(),

                today.getMonth(),

                today.getDate() + 1

            );


        let todayAppointments = 0;

        let upcomingAppointments = 0;

        let completedAppointments = 0;

        let cancelledAppointments = 0;

        let earnings = 0;


        appointments.forEach(
            (appointment) => {

                const appointmentDate =
                    new Date(
                        appointment.appointmentDate
                    );


                const status =
                    appointment.status
                        ?.toLowerCase();


                if (
                    appointmentDate >=
                    startOfDay &&
                    appointmentDate <
                    endOfDay
                ) {

                    todayAppointments++;

                }


                if (
                    appointmentDate >=
                    startOfDay &&
                    ![
                        "completed",
                        "cancelled",
                        "rejected"
                    ].includes(status)
                ) {

                    upcomingAppointments++;

                }


                if (
                    status ===
                    "completed"
                ) {

                    completedAppointments++;


                    earnings += Number(

                        appointment.amount ??
                        appointment.fee ??
                        appointment.consultationFee ??
                        appointment.paymentAmount ??
                        0

                    );

                }


                if (
                    status === "cancelled" ||
                    status === "rejected"
                ) {

                    cancelledAppointments++;

                }

            }
        );


        return res.status(200).json({

            success: true,

            data: {

                totalAppointments:
                    appointments.length,

                todayAppointments,

                upcomingAppointments,

                completedAppointments,

                cancelledAppointments,

                earnings

            }

        });

    }
    catch (error) {

        console.error(
            "Appointment statistics error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch appointment statistics."

        });

    }

};


module.exports = {

    getDoctorAppointments,

    getDoctorAppointmentById,

    getDoctorAppointmentStats

};