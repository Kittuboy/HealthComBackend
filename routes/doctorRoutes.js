
const express = require("express");
const User = require("../models/User");

const router =
  express.Router();

const {
  getRecommendedDoctors,
} = require("../controllers/doctorController");


// =========================================================
// RECOMMENDED DOCTORS
// =========================================================

router.get(
  "/recommended/:userId",
  getRecommendedDoctors
);




/*
=========================================================
GET ALL DOCTORS
GET /api/doctors
=========================================================
*/

router.get("/", async (req, res) => {
    try {

        const {
            search = "",
            specialty = "",
            location = "",
        } = req.query;


        /*
        =================================================
        ONLY DOCTORS
        =================================================
        */

        const filter = {
            role: "doctor",
        };


        /*
        =================================================
        SEARCH
        Doctor name OR specialty
        =================================================
        */

        if (search.trim()) {

            filter.$or = [

                {
                    firstName: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },

                {
                    lastName: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },

                {
                    specialty: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },

            ];

        }


        /*
        =================================================
        SPECIALTY FILTER
        =================================================
        */

        if (
            specialty.trim() &&
            specialty.toLowerCase() !== "all doctors"
        ) {

            filter.specialty = {
                $regex: `^${specialty.trim()}$`,
                $options: "i",
            };

        }


        /*
        =================================================
        LOCATION FILTER
        =================================================
        */

        if (location.trim()) {

            filter.location = {
                $regex: `^${location.trim()}$`,
                $options: "i",
            };

        }


        /*
        =================================================
        GET DOCTORS FROM USER COLLECTION
        =================================================
        */

        const doctors = await User.find(filter)
            .select(
                "firstName lastName profileImage specialty experience rating location address isVerified role"
            )
            .sort({
                rating: -1,
                createdAt: -1,
            })
            .lean();


        /*
        =================================================
        FORMAT DATA FOR FRONTEND
        =================================================
        */

        const formattedDoctors = doctors.map((doctor) => {

            return {

                _id: doctor._id,

                name: `Dr. ${doctor.firstName} ${doctor.lastName}`,

                specialty:
                    doctor.specialty ||
                    "General Physician",

                experience:
                    doctor.experience ||
                    "Experience not available",

                rating:
                    doctor.rating || 0,

                location:
                    doctor.location ||
                    doctor.address ||
                    "Location not available",

                image:
                    doctor.profileImage || "",

                available:
                    doctor.isVerified,

                isVerified:
                    doctor.isVerified,

                role:
                    doctor.role,

            };

        });


        /*
        =================================================
        RESPONSE
        =================================================
        */

        res.status(200).json({

            success: true,

            count: formattedDoctors.length,

            doctors: formattedDoctors,

        });


    } catch (error) {

        console.error(
            "Get doctors error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Failed to fetch doctors",

        });

    }
});


/*
=========================================================
GET SINGLE DOCTOR
GET /api/doctors/:id
=========================================================
*/

router.get("/:id", async (req, res) => {

    try {

        const doctor = await User.findOne({

            _id: req.params.id,

            role: "doctor",

        })
            .select(
                "firstName lastName email phone gender dateOfBirth profileImage specialty experience rating location address isVerified role"
            )
            .lean();


        if (!doctor) {

            return res.status(404).json({

                success: false,

                message: "Doctor not found",

            });

        }


        const formattedDoctor = {

            _id: doctor._id,

            name:
                `Dr. ${doctor.firstName} ${doctor.lastName}`,

            firstName:
                doctor.firstName,

            lastName:
                doctor.lastName,

            email:
                doctor.email,

            phone:
                doctor.phone,

            gender:
                doctor.gender,

            dateOfBirth:
                doctor.dateOfBirth,

            image:
                doctor.profileImage || "",

            specialty:
                doctor.specialty ||
                "General Physician",

            experience:
                doctor.experience ||
                "Experience not available",

            rating:
                doctor.rating || 0,

            location:
                doctor.location ||
                doctor.address ||
                "Location not available",

            available:
                doctor.isVerified,

            isVerified:
                doctor.isVerified,

            role:
                doctor.role,

        };


        res.status(200).json({

            success: true,

            doctor: formattedDoctor,

        });


    } catch (error) {

        console.error(
            "Get single doctor error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Failed to fetch doctor",

        });

    }

});




module.exports = router;
