const express = require("express");

const {
  getProfile,
  updateProfile,
  uploadProfileImage,
} = require("../controllers/profileController");

const upload = require("../middleware/upload");

const router =
  express.Router();

// GET PROFILE
router.get(
  "/:userId",
  getProfile
);

// UPLOAD PROFILE IMAGE
router.post(
  "/:userId/image",
  upload.single("profileImage"),
  uploadProfileImage
);

// UPDATE PROFILE DATA
router.put(
  "/:userId",
  updateProfile
);

module.exports = router;