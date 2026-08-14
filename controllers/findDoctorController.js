const mongoose = require("mongoose");
const User = require("../models/User");

// =========================================================
// GET ALL DOCTORS
// GET /api/find-doctors
// =========================================================

const getDoctors = async (req, res) => {
    try {

        const {
            search = "",
            specialty = "",
            location = "",
        } = req.query;

        // =====================================================
        // ONLY DOCTORS
        // =====================================================

        const filter = {
            role: "doctor",
        };

        // =====================================================
        // SEARCH
        // =====================================================

        if (search.trim()) {

            const searchValue = search.trim();

            filter.$or = [

                {
                    firstName: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },

                {
                    lastName: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },

                {
                    specialty: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },

                {
                    location: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },

            ];
        }

        // =====================================================
        // SPECIALTY
        // =====================================================

        if (
            specialty.trim() &&
            specialty.toLowerCase() !== "all doctors"
        ) {

            filter.specialty = {
                $regex: specialty.trim(),
                $options: "i",
            };

        }

        // =====================================================
        // LOCATION
        // =====================================================

        if (location.trim()) {

            filter.location = {
                $regex: location.trim(),
                $options: "i",
            };

        }

        // =====================================================
        // FETCH DOCTORS
        // =====================================================

        const doctors = await User.find(filter)
            .select(
                [
                    "_id",
                    "firstName",
                    "lastName",
                    "email",
                    "phone",
                    "profileImage",
                    "specialty",
                    "experience",
                    "rating",
                    "location",
                    "address",
                    "isVerified",
                    "role",
                    "createdAt",
                ].join(" ")
            )
            .sort({
                rating: -1,
                createdAt: -1,
            })
            .lean();

        // =====================================================
        // FORMAT DOCTORS
        // =====================================================

        const formattedDoctors = doctors.map((doctor) => {

            const fullName =
                `${doctor.firstName || ""} ${doctor.lastName || ""}`
                    .replace(/\s+/g, " ")
                    .trim();

            return {

                _id: doctor._id,

                firstName:
                    doctor.firstName || "",

                lastName:
                    doctor.lastName || "",

                name:
                    fullName
                        ? `Dr. ${fullName}`
                        : "Doctor",

                email:
                    doctor.email || "",

                phone:
                    doctor.phone || "",

                specialty:
                    doctor.specialty ||
                    "General Physician",

                experience:
                    doctor.experience || "",

                rating:
                    typeof doctor.rating === "number"
                        ? doctor.rating
                        : 0,

                location:
                    doctor.location ||
                    doctor.address ||
                    "Location not available",

                address:
                    doctor.address || "",

                profileImage:
                    doctor.profileImage || "",

                image:
                    doctor.profileImage || "",

                available:
                    doctor.isVerified === true,

                isAvailable:
                    doctor.isVerified === true,

                isVerified:
                    doctor.isVerified === true,

                role:
                    doctor.role,

            };

        });

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            count:
                formattedDoctors.length,

            doctors:
                formattedDoctors,

        });

    } catch (error) {

        console.error(
            "Get doctors error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch doctors",

        });

    }
};


// =========================================================
// GET SINGLE DOCTOR
// GET /api/find-doctors/:doctorId
// =========================================================

const getDoctorById = async (req, res) => {

    try {

        // =====================================================
        // GET DOCTOR ID FROM URL
        // =====================================================

        const doctorId =
            req.params.doctorId;

        console.log(
            "Requested Doctor ID:",
            doctorId
        );

        // =====================================================
        // CHECK ID
        // =====================================================

        if (!doctorId) {

            return res.status(400).json({

                success: false,

                message:
                    "Doctor ID is missing.",

            });

        }

        // =====================================================
        // VALIDATE MONGODB OBJECT ID
        // =====================================================

        if (
            !mongoose.Types.ObjectId.isValid(
                doctorId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid doctor ID.",

            });

        }

        // =====================================================
        // FIND DOCTOR
        // =====================================================

        const doctor =
            await User.findOne({

                _id: doctorId,

                role: "doctor",

            })
            .select(
                [
                    "_id",
                    "firstName",
                    "lastName",
                    "email",
                    "phone",
                    "gender",
                    "dateOfBirth",
                    "profileImage",
                    "specialty",
                    "experience",
                    "rating",
                    "location",
                    "address",
                    "isVerified",
                    "role",
                ].join(" ")
            )
            .lean();

        // =====================================================
        // NOT FOUND
        // =====================================================

        if (!doctor) {

            return res.status(404).json({

                success: false,

                message:
                    "Doctor not found",

            });

        }

        // =====================================================
        // FULL NAME
        // =====================================================

        const fullName =
            `${doctor.firstName || ""} ${doctor.lastName || ""}`
                .replace(/\s+/g, " ")
                .trim();

        // =====================================================
        // FORMAT DOCTOR
        // =====================================================

        const formattedDoctor = {

            _id:
                doctor._id,

            firstName:
                doctor.firstName || "",

            lastName:
                doctor.lastName || "",

            name:
                fullName
                    ? `Dr. ${fullName}`
                    : "Doctor",

            email:
                doctor.email || "",

            phone:
                doctor.phone || "",

            gender:
                doctor.gender || "",

            dateOfBirth:
                doctor.dateOfBirth || "",

            profileImage:
                doctor.profileImage || "",

            image:
                doctor.profileImage || "",

            specialty:
                doctor.specialty ||
                "General Physician",

            experience:
                doctor.experience || "",

            rating:
                typeof doctor.rating === "number"
                    ? doctor.rating
                    : 0,

            location:
                doctor.location ||
                doctor.address ||
                "Location not available",

            address:
                doctor.address || "",

            available:
                doctor.isVerified === true,

            isAvailable:
                doctor.isVerified === true,

            isVerified:
                doctor.isVerified === true,

            role:
                doctor.role,

        };

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            success: true,

            doctor:
                formattedDoctor,

        });

    } catch (error) {

        console.error(
            "Get single doctor error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch doctor",

        });

    }

};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
    getDoctors,
    getDoctorById,
};