
const admin =
    require("../config/firebaseAdmin");

const User =
    require("../models/User");

const Notification =
    require("../models/Notification");


// =====================================================
// SEND NOTIFICATION SERVICE
// =====================================================
// This service:
// 1. Saves notification in MongoDB
// 2. Finds only the target user's FCM tokens
// 3. Sends Firebase push notification
// 4. Removes invalid FCM tokens
// =====================================================

const sendNotification = async ({
    userId,
    title,
    message,
    type = "system",
    data = {}
}) => {

    try {

        // =================================================
        // VALIDATION
        // =================================================

        if (
            !userId ||
            !title ||
            !message
        ) {

            throw new Error(
                "userId, title and message are required"
            );

        }


        // =================================================
        // FIND USER
        // =================================================

        const user =
            await User.findById(userId);


        if (!user) {

            throw new Error(
                "User not found"
            );

        }


        // =================================================
        // SAVE NOTIFICATION TO MONGODB
        // =================================================

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
            "✅ Notification saved:",
            notification._id.toString()
        );


        // =================================================
        // GET USER FCM TOKENS
        // =================================================

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
            "📱 FCM tokens:",
            tokens.length
        );


        // =================================================
        // USER HAS NO FCM TOKEN
        // =================================================

        if (
            tokens.length === 0
        ) {

            console.log(
                "⚠️ User has no FCM token"
            );


            return {

                success: true,

                pushSent: false,

                reason:
                    "User has no FCM token",

                notification:
                    notification

            };

        }


        // =================================================
        // FIREBASE DATA
        // =================================================
        // Firebase data values MUST be strings
        // =================================================

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


        // =================================================
        // CUSTOM DATA
        // =================================================

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


        // =================================================
        // SEND FIREBASE PUSH
        // =================================================

        console.log(
            "🚀 Sending Firebase push..."
        );


        const firebaseResponse =
            await admin
                .messaging
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


        // =================================================
        // FIREBASE RESULT
        // =================================================

        console.log(
            "========================================="
        );

        console.log(
            "🔥 FIREBASE NOTIFICATION RESULT"
        );

        console.log(
            "User:",
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


        // =================================================
        // FIND INVALID TOKENS
        // =================================================

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
                            "Error:",
                            result.error?.code,
                            result.error?.message
                        );


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


        // =================================================
        // REMOVE INVALID TOKENS
        // =================================================

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
                "🧹 Invalid FCM tokens removed:",
                invalidTokens.length
            );

        }


        // =================================================
        // FINAL RESULT
        // =================================================

        return {

            success: true,

            pushSent:
                firebaseResponse.successCount > 0,

            successCount:
                firebaseResponse.successCount,

            failureCount:
                firebaseResponse.failureCount,

            notification:
                notification

        };


    } catch (error) {

        console.error(
            "❌ Notification service error:",
            error
        );


        throw error;

    }

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    sendNotification
};
