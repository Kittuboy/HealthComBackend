const express = require("express");

const router = express.Router();


const {

  registerUser,

  verifyEmailOtp,

  loginUser,

  verifyLoginOtp,

  refreshTokenController,

  logoutUser,
  
  forgotPassword,
  verifyForgotOtp,
  resetPassword,

} = require("../controllers/authController");





router.post(
  "/register",
  registerUser
);



router.post(
  "/verify-email",
  verifyEmailOtp
);



router.post(
  "/login",
  loginUser
);



router.post(
  "/verify-login",
  verifyLoginOtp
);



// refresh login
router.post(
  "/refresh-token",
  refreshTokenController
);



// logout
router.post(
  "/logout",
  logoutUser
);


router.post(
  "/forgot-password",
  forgotPassword
);


router.post(
  "/verify-forgot-otp",
  verifyForgotOtp
);


router.post(
  "/reset-password",
  resetPassword
);


module.exports = router;