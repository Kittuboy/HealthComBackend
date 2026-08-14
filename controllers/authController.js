const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  sendNotification,
} = require("../services/notificationService");

const User = require("../models/User");

const {
  sendVerificationOtp,
  sendLoginOtp,
  sendPasswordResetOtp,
} = require("../services/emailService");

const generateToken =
  require("../services/generateToken");

const generateRefreshToken =
  require("../services/generateRefreshToken");



function generateOtp() {

  return String(
    crypto.randomInt(100000, 1000000)
  );

}



function hashOtp(otp) {

  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

}





// ===========================
// REGISTER
// ===========================

async function registerUser(req, res, next) {

  try {


    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      gender,
      dateOfBirth,
      role
    } = req.body;



    const normalizedEmail =
      email.toLowerCase().trim();



    const existingUser =
      await User.findOne({
        email: normalizedEmail
      });



    if (existingUser && existingUser.isVerified) {

      return res.status(409).json({
        message: "Account already exists"
      });

    }



    const otp = generateOtp();



    const user =
      existingUser || await User.create({

        firstName,
        lastName,
        email: normalizedEmail,
        phone,
        password,
        gender,
        dateOfBirth,
        role: role || "patient",
        isVerified: false

      });



    user.verificationOTP =
      hashOtp(otp);



    user.verificationOTPExpiry =
      new Date(
        Date.now() + 5 * 60 * 1000
      );



    await user.save({
      validateBeforeSave: false
    });



    await sendVerificationOtp({

      email: user.email,
      firstName: user.firstName,
      otp

    });



    res.status(201).json({

      message: "OTP sent successfully",

      email: user.email

    });



  }
  catch (error) {

    next(error);

  }

}









// ===========================
// VERIFY EMAIL OTP
// ===========================

async function verifyEmailOtp(req, res, next) {

  try {


    const {
      email,
      otp
    } = req.body;



    const user =
      await User.findOne({

        email: email.toLowerCase().trim()

      })
        .select(
          "+verificationOTP +verificationOTPExpiry"
        );



    if (!user) {

      return res.status(404).json({

        message: "User not found"

      });

    }




    if (
      !user.verificationOTP ||
      user.verificationOTPExpiry < new Date()
    ) {

      return res.status(400).json({

        message: "OTP expired"

      });

    }





    if (
      user.verificationOTP !== hashOtp(otp)
    ) {

      return res.status(400).json({

        message: "Invalid OTP"

      });

    }





    user.isVerified = true;

    user.verificationOTP = undefined;

    user.verificationOTPExpiry = undefined;



    await user.save({
      validateBeforeSave: false
    });




    res.json({

      message: "Email verified successfully"

    });



  }
  catch (error) {

    next(error);

  }


}









// ===========================
// LOGIN
// ===========================


async function loginUser(req, res, next) {

  try {


    const {
      email,
      password
    } = req.body;



    const user =
      await User.findOne({

        email: email.toLowerCase().trim()

      })
        .select("+password");




    if (!user) {

      return res.status(401).json({

        message: "Invalid email or password"

      });

    }



    if (!user.isVerified) {

      return res.status(401).json({

        message: "Verify email first"

      });

    }



    const match =
      await bcrypt.compare(
        password,
        user.password
      );



    if (!match) {

      return res.status(401).json({

        message: "Invalid email or password"

      });

    }






    const otp =
      generateOtp();



    user.loginOTP =
      hashOtp(otp);



    user.loginOTPExpiry =
      new Date(
        Date.now() + 5 * 60 * 1000
      );



    await user.save({
      validateBeforeSave: false
    });





    await sendLoginOtp({

      email: user.email,

      firstName: user.firstName,

      otp

    });





    res.json({

      message: "Login OTP sent",

      email: user.email

    });



  }
  catch (error) {

    next(error);

  }

}









// ===========================
// VERIFY LOGIN OTP
// ===========================


// ===========================
// VERIFY LOGIN OTP
// ===========================

async function verifyLoginOtp(req, res, next) {

  try {

    const {
      email,
      otp
    } = req.body;


    // =================================================
    // FIND USER
    // =================================================

    const user =
      await User.findOne({

        email:
          email.toLowerCase().trim()

      })
        .select(
          "+loginOTP +loginOTPExpiry"
        );


    if (!user) {

      return res.status(404).json({

        message:
          "User not found"

      });

    }


    // =================================================
    // CHECK OTP EXPIRY
    // =================================================

    if (
      !user.loginOTP ||
      user.loginOTPExpiry < new Date()
    ) {

      return res.status(400).json({

        message:
          "OTP expired"

      });

    }


    // =================================================
    // VERIFY OTP
    // =================================================

    if (
      user.loginOTP !== hashOtp(otp)
    ) {

      return res.status(400).json({

        message:
          "Invalid OTP"

      });

    }


    // =================================================
    // CLEAR LOGIN OTP
    // =================================================

    user.loginOTP = undefined;

    user.loginOTPExpiry = undefined;


    await user.save({

      validateBeforeSave: false

    });


    // =================================================
    // GENERATE ACCESS TOKEN
    // =================================================

    const accessToken =
      generateToken(user._id);


    // =================================================
    // GENERATE REFRESH TOKEN
    // =================================================

    const refreshToken =
      generateRefreshToken(user._id);


    // =================================================
    // SAVE REFRESH TOKEN IN COOKIE
    // =================================================

    res.cookie(

      "refreshToken",

      refreshToken,

      {

        httpOnly: true,

        secure: false,

        sameSite: "strict",

        maxAge:
          30 *
          24 *
          60 *
          60 *
          1000

      }

    );


    // =================================================
    // LOGIN NOTIFICATION
    // =================================================
    // Notification failure must NOT make login fail.
    // =================================================

    try {

      await sendNotification({

        userId:
          user._id.toString(),

        title:
          "Login Successful",

        message:
          `Welcome back, ${user.firstName || "User"}! You have successfully logged in to HealthCom.`,

        type:
          "login",

        data: {

          type:
            "login",

          userId:
            user._id.toString(),

          loginTime:
            new Date().toISOString()

        }

      });


      console.log(
        "Login notification sent successfully:",
        user.email
      );


    } catch (notificationError) {

      console.error(
        "Login notification failed:",
        notificationError.message
      );

    }


    // =================================================
    // SUCCESS RESPONSE
    // =================================================

    return res.json({

      message:
        "Login Successful",

      accessToken,

      user: {

        id:
          user._id,

        firstName:
          user.firstName,

        lastName:
          user.lastName,

        email:
          user.email,

        role:
          user.role

      }

    });


  } catch (error) {

    console.error(
      "Verify Login OTP Error:",
      error
    );


    next(error);

  }

}









// ===========================
// REFRESH TOKEN
// ===========================


async function refreshTokenController(
  req,
  res
) {

  try {


    const refreshToken =
      req.cookies.refreshToken;



    if (!refreshToken) {

      return res.status(401).json({

        message: "No refresh token"

      });

    }





    const decoded =
      jwt.verify(

        refreshToken,

        process.env.JWT_REFRESH_SECRET

      );




    const user =
      await User.findById(
        decoded.id
      );



    if (!user) {

      return res.status(401).json({

        message: "User not found"

      });

    }




    const accessToken =
      generateToken(
        user._id
      );





    res.json({

      accessToken,


      user: {

        id: user._id,

        firstName: user.firstName,

        lastName: user.lastName,

        email: user.email,

        role: user.role

      }


    });



  }
  catch (error) {

    return res.status(401).json({

      message: "Invalid refresh token"

    });

  }


}









// ===========================
// LOGOUT
// ===========================


async function logoutUser(req, res) {


  res.clearCookie(
    "refreshToken"
  );


  res.json({

    message: "Logout successful"

  });


}



// =============================================================================================
// Forgotten Password and Reset Password functionalities are not implemented in this code snippet.
// ==============================================================================================


async function forgotPassword(req, res, next) {

  try {

    const { email } = req.body;


    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });


    if (!user) {

      return res.status(404).json({

        message: "User not found"

      });

    }



    const otp = generateOtp();



    user.forgotPasswordOTP =
      hashOtp(otp);



    user.forgotPasswordOTPExpiry =
      new Date(
        Date.now() + 5 * 60 * 1000
      );



    await user.save({
      validateBeforeSave: false
    });



    await sendPasswordResetOtp({

      email: user.email,

      firstName: user.firstName,

      otp

    });



    res.json({

      message: "Password reset OTP sent",

      email: user.email

    });


  }
  catch (err) {

    next(err);

  }

}


async function verifyForgotOtp(req, res, next) {

  try {

    const {
      email,
      otp
    } = req.body;



    const user =
      await User.findOne({
        email: email.toLowerCase().trim()
      }).select(
        "+forgotPasswordOTP +forgotPasswordOTPExpiry"
      );



    if (!user) {

      return res.status(404).json({

        message: "User not found"

      });

    }




    if (
      !user.forgotPasswordOTP ||
      user.forgotPasswordOTPExpiry < new Date()
    ) {

      return res.status(400).json({

        message: "OTP expired"

      });

    }



    if (
      user.forgotPasswordOTP !== hashOtp(otp)
    ) {

      return res.status(400).json({

        message: "Invalid OTP"

      });

    }



    res.json({

      message: "OTP verified",

      email: user.email

    });



  }
  catch (err) {

    next(err);

  }

}


// ===========================
// RESET PASSWORD
// ===========================

async function resetPassword(req, res, next) {

    try {

        const {
            email,
            password
        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (!email || !password) {

            return res.status(400).json({

                message:
                    "Email and new password are required"

            });

        }


        // =================================================
        // FIND USER
        // =================================================

        const user =
            await User.findOne({

                email:
                    email.toLowerCase().trim()

            });


        if (!user) {

            return res.status(404).json({

                message:
                    "User not found"

            });

        }


        // =================================================
        // UPDATE PASSWORD
        // =================================================

        user.password =
            password;


        // =================================================
        // CLEAR FORGOT PASSWORD OTP
        // =================================================

        user.forgotPasswordOTP =
            undefined;

        user.forgotPasswordOTPExpiry =
            undefined;


        // =================================================
        // SAVE USER
        // =================================================

        await user.save();


        console.log(
            "Password changed successfully:",
            user.email
        );


        // =================================================
        // PASSWORD CHANGE NOTIFICATION
        // =================================================
        // Notification failure should NOT make
        // password reset fail.
        // =================================================

        try {

            await sendNotification({

                userId:
                    user._id.toString(),

                title:
                    "Password Changed",

                message:
                    "Your HealthCom password has been changed successfully.",

                type:
                    "password_changed",

                data: {

                    type:
                        "password_changed",

                    userId:
                        user._id.toString(),

                    changedAt:
                        new Date().toISOString()

                }

            });


            console.log(
                "Password change notification sent successfully:",
                user.email
            );


        } catch (notificationError) {

            console.error(
                "Password change notification failed:",
                notificationError.message
            );

        }


        // =================================================
        // SUCCESS RESPONSE
        // =================================================

        return res.json({

            message:
                "Password reset successfully"

        });


    } catch (err) {

        console.error(
            "Reset Password Error:",
            err
        );


        next(err);

    }

}


module.exports = {

  registerUser,

  verifyEmailOtp,

  loginUser,

  verifyLoginOtp,

  refreshTokenController,

  logoutUser,

  forgotPassword,
  verifyForgotOtp,
  resetPassword


};