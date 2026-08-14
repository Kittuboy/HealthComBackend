const mongoose = require("mongoose");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

// =========================================================
// GET PROFILE
// GET /api/profile/:userId
// =========================================================

const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // -------------------------------------------------------
    // Validate MongoDB ID
    // -------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // -------------------------------------------------------
    // Find user
    // -------------------------------------------------------

    const user = await User.findById(userId).select(
      "-password -verificationOTP -verificationOTPExpiry -loginOTP -loginOTPExpiry -forgotPasswordOTP -forgotPasswordOTPExpiry"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------------------------------
    // Response
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};

// =========================================================
// UPDATE PROFILE
// PUT /api/profile/:userId
// =========================================================

const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // -------------------------------------------------------
    // Validate MongoDB ID
    // -------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // -------------------------------------------------------
    // Allowed fields
    // -------------------------------------------------------

    const allowedFields = [
      "firstName",
      "lastName",
      "phone",
      "gender",
      "dateOfBirth",
      "profileImage",
      "address",
      "bloodGroup",
    ];

    const updateData = {};

    // -------------------------------------------------------
    // Only allow profile fields
    // -------------------------------------------------------

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // -------------------------------------------------------
    // Check empty update
    // -------------------------------------------------------

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No profile data provided",
      });
    }

    // -------------------------------------------------------
    // Update user
    // -------------------------------------------------------

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "-password -verificationOTP -verificationOTPExpiry -loginOTP -loginOTPExpiry -forgotPasswordOTP -forgotPasswordOTPExpiry"
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------------------------------
    // Response
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};





// =========================================================
// UPLOAD PROFILE IMAGE
// POST /api/profile/:userId/image
// =========================================================

const uploadProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;

    // -------------------------------------------------------
    // Validate user ID
    // -------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // -------------------------------------------------------
    // Check image
    // -------------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    // -------------------------------------------------------
    // Check user
    // -------------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------------------------------
    // Upload to Cloudinary
    // -------------------------------------------------------

    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const stream =
          cloudinary.uploader.upload_stream(
            {
              folder: "healthcom/profile-images",

              public_id:
                `patient_${userId}`,

              overwrite: true,

              resource_type: "image",

              transformation: [
                {
                  width: 500,
                  height: 500,
                  crop: "fill",
                  gravity: "face",
                  quality: "auto",
                  fetch_format: "auto",
                },
              ],
            },

            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

        stream.end(req.file.buffer);
      });
    };

    const result =
      await uploadToCloudinary();

    // -------------------------------------------------------
    // Save Cloudinary URL in MongoDB
    // -------------------------------------------------------

    user.profileImage =
      result.secure_url;

    await user.save();

    // -------------------------------------------------------
    // Response
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Profile image updated successfully",

      profileImage:
        result.secure_url,

      user,
    });

  } catch (error) {
    console.error(
      "Profile Image Upload Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to upload profile image",
    });
  }
};




module.exports = {
  getProfile,
  updateProfile,
  uploadProfileImage,
};