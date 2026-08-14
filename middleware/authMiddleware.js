const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {

    try {

        /*
        ====================================================
        1. GET AUTHORIZATION HEADER
        ====================================================
        */

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token required."

            });

        }


        /*
        ====================================================
        2. GET TOKEN
        ====================================================
        */

        const token =
            authHeader.split(" ")[1];


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token missing."

            });

        }


        /*
        ====================================================
        3. VERIFY JWT
        ====================================================
        */

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        console.log(
            "===================================="
        );

        console.log(
            "JWT DECODED:"
        );

        console.log(
            decoded
        );


        /*
        ====================================================
        4. FIND USER ID FROM JWT
        ====================================================
        
        Different projects use different payload names:
        
        {
            id: "..."
        }

        OR

        {
            userId: "..."
        }

        OR

        {
            _id: "..."
        }

        ====================================================
        */

        const userId =
            decoded._id ||
            decoded.id ||
            decoded.userId;


        if (!userId) {

            console.log(
                "JWT does not contain user ID"
            );

            return res.status(401).json({

                success: false,

                message:
                    "Invalid authentication payload."

            });

        }


        /*
        ====================================================
        5. FIND USER FROM DATABASE
        ====================================================
        */

        const user =
            await User.findById(userId).select(
                "-password -otp -otpHash -resetPasswordToken"
            );


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "User account not found."

            });

        }


        /*
        ====================================================
        6. CHECK USER STATUS
        ====================================================
        */

        if (
            user.isActive === false
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is inactive."

            });

        }


        /*
        ====================================================
        7. ATTACH USER TO REQUEST
        ====================================================
        */

        req.user = user;


        console.log(
            "Authenticated User:"
        );

        console.log({

            id: user._id,

            email: user.email,

            role: user.role

        });


        console.log(
            "===================================="
        );


        /*
        ====================================================
        8. CONTINUE
        ====================================================
        */

        next();

    }
    catch (error) {

        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error
        );


        /*
        -----------------------------------------------
        JWT EXPIRED
        -----------------------------------------------
        */

        if (
            error.name ===
            "TokenExpiredError"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token expired."

            });

        }


        /*
        -----------------------------------------------
        INVALID JWT
        -----------------------------------------------
        */

        if (
            error.name ===
            "JsonWebTokenError"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid authentication token."

            });

        }


        /*
        -----------------------------------------------
        OTHER ERROR
        -----------------------------------------------
        */

        return res.status(500).json({

            success: false,

            message:
                "Authentication failed."

        });

    }

};


module.exports = authMiddleware;