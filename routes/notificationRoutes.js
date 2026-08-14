
const express = require("express");

const admin =
    require("../config/firebaseAdmin");

const User =
    require("../models/User");

const Notification =
    require("../models/Notification");




const router =
    express.Router();


// =====================================================
// SAVE FCM TOKEN
// =====================================================

router.post(
    "/save-token",
    async (req, res) => {

        try {

            const {
                userId,
                token
            } = req.body;


            // =========================================
            // VALIDATION
            // =========================================

            if (
                !userId ||
                !token
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "userId and token are required"

                });

            }


            // =========================================
            // FIND USER
            // =========================================

            const user =
                await User.findById(userId);


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found"

                });

            }


            // =========================================
            // INITIALIZE FCM TOKENS
            // =========================================

            if (
                !Array.isArray(
                    user.fcmTokens
                )
            ) {

                user.fcmTokens = [];

            }


            // =========================================
            // SAVE ONLY UNIQUE TOKEN
            // =========================================

            if (
                !user.fcmTokens.includes(token)
            ) {

                user.fcmTokens.push(token);

                await user.save();

                console.log(
                    "✅ New FCM token saved for user:",
                    userId
                );

            } else {

                console.log(
                    "ℹ️ FCM token already exists for user:",
                    userId
                );

            }


            // =========================================
            // RESPONSE
            // =========================================

            return res.json({

                success: true,

                message:
                    "FCM token saved successfully"

            });


        } catch (error) {

            console.error(
                "❌ Save FCM token error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to save FCM token",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// GET USER NOTIFICATIONS
// =====================================================

router.get(
    "/user/:userId",
    async (req, res) => {

        try {

            const {
                userId
            } = req.params;


            // =========================================
            // FIND ONLY THIS USER'S NOTIFICATIONS
            // =========================================

            const notifications =
                await Notification
                    .find({
                        userId: userId
                    })
                    .sort({
                        createdAt: -1
                    });


            return res.json({

                success: true,

                notifications:
                    notifications

            });


        } catch (error) {

            console.error(
                "❌ Get notifications error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to get notifications",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

router.put(
    "/:id/read",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const notification =
                await Notification
                    .findByIdAndUpdate(

                        id,

                        {
                            $set: {
                                read: true
                            }
                        },

                        {
                            new: true
                        }

                    );


            if (!notification) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Notification not found"

                });

            }


            return res.json({

                success: true,

                message:
                    "Notification marked as read",

                notification:
                    notification

            });


        } catch (error) {

            console.error(
                "❌ Mark read error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to mark notification",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// MARK ALL AS READ
// =====================================================

router.put(
    "/user/:userId/read-all",
    async (req, res) => {

        try {

            const {
                userId
            } = req.params;


            await Notification.updateMany(

                {
                    userId: userId,

                    read: false
                },

                {
                    $set: {
                        read: true
                    }
                }

            );


            return res.json({

                success: true,

                message:
                    "All notifications marked as read"

            });


        } catch (error) {

            console.error(
                "❌ Mark all read error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to mark all notifications",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// SEND NOTIFICATION TO SPECIFIC USER
// =====================================================

router.post(
    "/send",
    async (req, res) => {

        try {

            const {
                userId,
                title,
                message,
                type,
                data
            } = req.body;


            // =========================================
            // VALIDATION
            // =========================================

            if (
                !userId ||
                !title ||
                !message
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "userId, title and message are required"

                });

            }


            // =========================================
            // FIND USER FIRST
            // =========================================

            const user =
                await User.findById(userId);


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found"

                });

            }


            // =========================================
            // SAVE NOTIFICATION TO MONGODB
            // =========================================

            const notification =
                await Notification.create({

                    userId: userId,

                    title: title,

                    message: message,

                    type:
                        type || "system",

                    data:
                        data || {},

                    read: false

                });


            console.log(
                "✅ Notification saved to MongoDB:",
                notification._id.toString()
            );


            // =========================================
            // GET USER FCM TOKENS
            // =========================================

            const tokens =
                Array.isArray(
                    user.fcmTokens
                )
                    ? [
                        ...new Set(
                            user.fcmTokens
                        )
                    ]
                    : [];


            console.log(
                "👤 Notification user:",
                userId
            );

            console.log(
                "📱 FCM tokens found:",
                tokens.length
            );


            // =========================================
            // NO FCM TOKEN
            // =========================================

            if (
                tokens.length === 0
            ) {

                console.log(
                    "⚠️ User has no FCM tokens"
                );


                return res.json({

                    success: true,

                    message:
                        "Notification saved, but user has no FCM token",

                    notification:
                        notification

                });

            }


            // =========================================
            // PREPARE FCM DATA
            // =========================================
            // Firebase data values MUST be strings
            // =========================================

            const firebaseData = {

                notificationId:
                    notification._id.toString(),

                userId:
                    userId.toString(),

                title:
                    String(title),

                message:
                    String(message),

                type:
                    String(
                        type || "system"
                    )

            };


            // =========================================
            // ADD CUSTOM DATA
            // =========================================

            if (
                data &&
                typeof data === "object"
            ) {

                Object.keys(data)
                    .forEach(
                        (key) => {

                            if (
                                data[key] !==
                                undefined &&
                                data[key] !==
                                null
                            ) {

                                firebaseData[key] =
                                    String(
                                        data[key]
                                    );

                            }

                        }
                    );

            }


            // =========================================
            // SEND FIREBASE PUSH
            // =========================================

            console.log(
                "🚀 Sending Firebase notification..."
            );


            const firebaseResponse =
                await admin
                    .messaging()
                    .sendEachForMulticast({

                        tokens:
                            tokens,

                        notification: {

                            title:
                                String(title),

                            body:
                                String(message)

                        },

                        data:
                            firebaseData,

                        webpush: {

                            notification: {

                                title:
                                    String(title),

                                body:
                                    String(message),

                                icon:
                                    "/favicon.ico",

                                badge:
                                    "/favicon.ico"

                            }

                        }

                    });


            // =========================================
            // FIREBASE RESULT
            // =========================================

            console.log(
                "========================================="
            );

            console.log(
                "🔥 FIREBASE PUSH RESULT"
            );

            console.log(
                "User ID:",
                userId
            );

            console.log(
                "Tokens:",
                tokens.length
            );

            console.log(
                "Success:",
                firebaseResponse.successCount
            );

            console.log(
                "Failed:",
                firebaseResponse.failureCount
            );


            // =========================================
            // CHECK EVERY TOKEN
            // =========================================

            const invalidTokens = [];


            firebaseResponse.responses
                .forEach(
                    (result, index) => {

                        if (
                            result.success
                        ) {

                            console.log(
                                `✅ Token ${index} sent successfully`
                            );

                        } else {

                            console.error(
                                `❌ Token ${index} failed`
                            );

                            console.error(
                                "Error code:",
                                result.error?.code
                            );

                            console.error(
                                "Error message:",
                                result.error?.message
                            );


                            // =================================
                            // REMOVE INVALID / EXPIRED TOKENS
                            // =================================

                            if (

                                result.error?.code ===
                                "messaging/registration-token-not-registered" ||

                                result.error?.code ===
                                "messaging/invalid-registration-token"

                            ) {

                                invalidTokens.push(
                                    tokens[index]
                                );

                            }

                        }

                    }
                );


            console.log(
                "========================================="
            );


            // =========================================
            // REMOVE INVALID TOKENS FROM USER
            // =========================================

            if (
                invalidTokens.length > 0
            ) {

                await User.findByIdAndUpdate(

                    userId,

                    {
                        $pull: {

                            fcmTokens: {

                                $in:
                                    invalidTokens

                            }

                        }

                    }

                );


                console.log(
                    "🧹 Removed invalid FCM tokens:",
                    invalidTokens.length
                );

            }


            // =========================================
            // FINAL RESPONSE
            // =========================================

            return res.json({

                success: true,

                message:
                    "Notification sent successfully",

                notification:
                    notification,

                firebase: {

                    successCount:
                        firebaseResponse.successCount,

                    failureCount:
                        firebaseResponse.failureCount

                }

            });


        } catch (error) {

            console.error(
                "========================================="
            );

            console.error(
                "❌ SEND NOTIFICATION ERROR"
            );

            console.error(
                error
            );

            console.error(
                "========================================="
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to send notification",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports =
    router;
