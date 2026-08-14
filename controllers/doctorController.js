
const User = require("../models/User");

// =========================================================
// GET RECOMMENDED DOCTORS
// =========================================================
// Patient ke liye verified doctors return karta hai.
// Same User collection use ho rahi hai.
// =========================================================

const getRecommendedDoctors = async (req, res) => {
  try {

    const { userId } = req.params;

    // -----------------------------------------------------
    // CHECK PATIENT
    // -----------------------------------------------------

    const patient = await User.findOne({
      _id: userId,
      role: "patient",
    }).select(
      "firstName lastName gender dateOfBirth bloodGroup address profileImage"
    );

    if (!patient) {

      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });

    }


    // -----------------------------------------------------
    // GET VERIFIED DOCTORS
    // -----------------------------------------------------

    const doctors = await User.find({
      role: "doctor",
      isVerified: true,
    })
      .select(
        "firstName lastName email phone gender profileImage address role isVerified createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(10);


    // -----------------------------------------------------
    // RECOMMENDATION SCORE
    // -----------------------------------------------------
    // Abhi available User fields ke basis par basic
    // recommendation score calculate kar rahe hain.
    //
    // Future mein:
    // specialization
    // experience
    // rating
    // availability
    // consultationFee
    // etc.
    // add kiya ja sakta hai.
    // -----------------------------------------------------

    const recommendedDoctors =
      doctors
        .map((doctor) => {

          let score = 0;


          // -------------------------------------------------
          // VERIFIED DOCTOR
          // -------------------------------------------------

          if (doctor.isVerified) {
            score += 30;
          }


          // -------------------------------------------------
          // PROFILE IMAGE
          // -------------------------------------------------

          if (doctor.profileImage) {
            score += 10;
          }


          // -------------------------------------------------
          // COMPLETE PROFILE
          // -------------------------------------------------

          if (doctor.firstName) {
            score += 5;
          }

          if (doctor.lastName) {
            score += 5;
          }

          if (doctor.phone) {
            score += 5;
          }

          if (doctor.address) {
            score += 5;
          }


          // -------------------------------------------------
          // GENDER
          // -------------------------------------------------
          // Gender ko strong medical recommendation factor
          // nahi bana rahe. Sirf small preference factor.
          // -------------------------------------------------

          if (
            patient.gender &&
            doctor.gender &&
            patient.gender === doctor.gender
          ) {
            score += 5;
          }


          return {
            ...doctor.toObject(),

            recommendationScore: score,
          };

        })
        .sort(
          (a, b) =>
            b.recommendationScore -
            a.recommendationScore
        );


    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(200).json({

      success: true,

      patient: {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
      },

      count:
        recommendedDoctors.length,

      doctors:
        recommendedDoctors,

    });

  } catch (error) {

    console.error(
      "Recommended Doctors Error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to fetch recommended doctors.",

      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,

    });

  }
};



module.exports = {
  getRecommendedDoctors,
};
