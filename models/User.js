const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =========================================================
    // BASIC INFORMATION
    // =========================================================

    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    // =========================================================
    // PERSONAL INFORMATION
    // =========================================================

    gender: {
      type: String,
      required: true,
      enum: [
        "female",
        "male",
        "other",
        "prefer-not-to-say",
      ],
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    // =========================================================
    // PROFILE INFORMATION
    // =========================================================

    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    patientId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    bloodGroup: {
      type: String,
      enum: [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
        "",
      ],
      default: "",
    },

    // =========================================================
    // ROLE
    // =========================================================

    role: {
      type: String,
      enum: ["patient", "doctor"],
      default: "patient",
    },

    // =========================================================
    // DOCTOR INFORMATION
    // =========================================================

    specialty: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    experience: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    // =========================================================
    // VERIFICATION
    // =========================================================

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationOTP: {
      type: String,
      select: false,
    },

    verificationOTPExpiry: {
      type: Date,
      select: false,
    },

    // =========================================================
    // LOGIN OTP
    // =========================================================

    loginOTP: {
      type: String,
      select: false,
    },

    loginOTPExpiry: {
      type: Date,
      select: false,
    },

    // =========================================================
    // FORGOT PASSWORD OTP
    // =========================================================

    forgotPasswordOTP: {
      type: String,
      select: false,
    },

    forgotPasswordOTPExpiry: {
      type: Date,
      select: false,
    },

    fcmTokens: [
    {
        type: String
    }
],
  },
  {
    timestamps: true,
  }
);

// =========================================================
// PASSWORD HASH
// =========================================================

userSchema.pre("save", async function hashPassword() {

  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(
    this.password,
    12
  );
});

module.exports = mongoose.model(
  "User",
  userSchema
);