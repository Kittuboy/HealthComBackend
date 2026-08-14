const crypto = require("crypto");

const User = require("../../models/User");

const DoctorSubscription = require("../models/DoctorSubscription");

const PaymentTransaction = require("../models/PaymentTransaction");

const DOCTOR_PLANS = require("../utils/subscriptionPlans");

const {
    createEasebuzzPayment,
    verifyEasebuzzResponse,
} = require("../services/easebuzzService");

const {
    sendSubscriptionSuccessEmail,
    sendSubscriptionFailureEmail,
} = require("../../services/emailService");


// =========================================================
// ENV
// =========================================================

const FRONTEND_URL =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

const BACKEND_URL =
    process.env.BACKEND_URL ||
    "http://localhost:5000";


// =========================================================
// GET SUBSCRIPTION
// =========================================================

const getSubscription = async (req, res) => {

    try {

        const userId = req.user.id;

        const user = await User.findOne({
            _id: userId,
            role: "doctor",
        });

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "Doctor account not found",
            });

        }


        let subscription =
            await DoctorSubscription.findOne({
                userId: user._id,
            });


        // -------------------------------------------------
        // FIRST TIME -> FREE PLAN
        // -------------------------------------------------

        if (!subscription) {

            const freePlan =
                DOCTOR_PLANS.free;


            subscription =
                await DoctorSubscription.create({

                    userId: user._id,

                    planId: freePlan.id,

                    planName: freePlan.name,

                    status: "active",

                    price: 0,

                    features:
                        freePlan.features,

                    startDate:
                        new Date(),

                    autoRenew: false,

                });

        }


        return res.status(200).json({

            success: true,

            subscription,

        });

    }

    catch (error) {

        console.error(
            "Get subscription error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to get subscription",

        });

    }

};


// =========================================================
// CREATE PAYMENT
// =========================================================

const createPayment = async (req, res) => {

    let transaction = null;


    try {

        const userId =
            req.user.id;

        const { planId } =
            req.body;


        console.log("");
        console.log("========================================");
        console.log("CREATE PAYMENT REQUEST");
        console.log("User ID:", userId);
        console.log("Plan ID:", planId);
        console.log("========================================");


        // =================================================
        // 1. FIND PLAN
        // =================================================

        const plan =
            DOCTOR_PLANS[planId];


        if (!plan) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid subscription plan",

            });

        }


        if (
            Number(plan.price) <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Free plan does not require payment",

            });

        }


        // =================================================
        // 2. FIND DOCTOR
        // =================================================

        const user =
            await User.findOne({

                _id: userId,

                role: "doctor",

            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "Doctor account not found",

            });

        }


        // =================================================
        // 3. USER PAYMENT DATA
        // =================================================

        const firstName =
            String(
                user.firstName ||
                "Doctor"
            )
                .trim()
                .replace(
                    /[^a-zA-Z0-9 ]/g,
                    ""
                )
                .substring(0, 50);


        const email =
            String(
                user.email || ""
            )
                .trim()
                .toLowerCase();


        const phone =
            String(
                user.phone || ""
            )
                .replace(/\D/g, "")
                .slice(-10);


        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Doctor email is required",

            });

        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(email)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid doctor email",

            });

        }


        if (
            !/^[6-9]\d{9}$/.test(phone)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Valid 10 digit Indian mobile number is required",

            });

        }


        // =================================================
        // 4. CALLBACK URL
        // =================================================

        const successUrl =
            `${BACKEND_URL}/api/doctor/subscription/payment/success`;

        const failureUrl =
            `${BACKEND_URL}/api/doctor/subscription/payment/failure`;


        console.log("Payment user:", {

            firstName,

            email,

            phone,

        });


        console.log(
            "Success URL:",
            successUrl
        );


        console.log(
            "Failure URL:",
            failureUrl
        );


        // =================================================
        // 5. TRANSACTION ID
        // =================================================

        const txnid =
            `HC_${Date.now()}_${crypto
                .randomBytes(4)
                .toString("hex")}`;


        // =================================================
        // 6. SAVE PAYMENT TRANSACTION
        // =================================================

        transaction =
            await PaymentTransaction.create({

                userId:
                    user._id,

                planId:
                    plan.id,

                amount:
                    Number(plan.price),

                transactionId:
                    txnid,

                status:
                    "created",

            });


        console.log(
            "Payment transaction created:",
            transaction._id
        );


        // =================================================
        // 7. CREATE EASEBUZZ PAYMENT
        // =================================================

        const payment =
            await createEasebuzzPayment({

                txnid,

                amount:
                    Number(plan.price),

                productinfo:
                    `HealthCom ${plan.name} Subscription`,

                firstname:
                    firstName,

                email,

                phone,

                surl:
                    successUrl,

                furl:
                    failureUrl,

            });


        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "EASEBUZZ FINAL RESPONSE"
        );
        console.dir(
            payment,
            {
                depth: null,
            }
        );
        console.log(
            "========================================"
        );


        // =================================================
        // 8. EASEBUZZ FAILED
        // =================================================

        if (
            !payment ||
            payment.success !== true
        ) {

            transaction.status =
                "failed";


            transaction.paymentResponse =
                payment?.rawResponse ||
                payment;


            await transaction.save();


            return res.status(502).json({

                success: false,

                message:
                    payment?.message ||
                    "Easebuzz payment initialization failed",

                gatewayResponse:
                    payment?.rawResponse ||
                    payment,

            });

        }


        // =================================================
        // 9. ACCESS KEY
        // =================================================

        const accessKey =
            String(
                payment.accessKey || ""
            ).trim();


        if (!accessKey) {

            transaction.status =
                "failed";


            transaction.paymentResponse =
                payment.rawResponse ||
                payment;


            await transaction.save();


            return res.status(502).json({

                success: false,

                message:
                    "Easebuzz access key missing",

            });

        }


        // =================================================
        // 10. PAYMENT URL
        // =================================================

        const paymentUrl =
            String(
                payment.paymentUrl || ""
            ).trim();


        if (!paymentUrl) {

            transaction.status =
                "failed";


            transaction.paymentResponse =
                payment.rawResponse ||
                payment;


            await transaction.save();


            return res.status(502).json({

                success: false,

                message:
                    "Easebuzz payment URL missing",

            });

        }


        // =================================================
        // 11. RETURN TO FRONTEND
        // =================================================

        return res.status(200).json({

            success: true,

            transactionId:
                txnid,

            accessKey,

            paymentUrl,

            planId:
                plan.id,

            planName:
                plan.name,

            amount:
                Number(plan.price),

        });

    }

    catch (error) {

        console.error(
            "Create payment error:",
            error
        );


        if (transaction) {

            try {

                transaction.status =
                    "failed";

                transaction.paymentResponse = {

                    error:
                        error.message,

                };

                await transaction.save();

            }

            catch (saveError) {

                console.error(
                    "Failed to update transaction:",
                    saveError
                );

            }

        }


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to create payment",

        });

    }

};


// =========================================================
// PAYMENT SUCCESS CALLBACK
// =========================================================

const paymentSuccess = async (
    req,
    res
) => {

    try {

        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            "EASEBUZZ SUCCESS CALLBACK"
        );

        console.log(
            "METHOD:",
            req.method
        );

        console.log(
            "CONTENT TYPE:",
            req.headers["content-type"]
        );

        console.log(
            "BODY:",
            req.body
        );

        console.log(
            "QUERY:",
            req.query
        );

        console.log(
            "========================================"
        );


        // =================================================
        // 1. NORMALIZE EASEBUZZ DATA
        // =================================================

        const paymentData = {

            ...(req.query || {}),

            ...(req.body || {}),

        };


        const txnid =
            String(
                paymentData.txnid || ""
            ).trim();


        if (!txnid) {

            console.error(
                "Easebuzz transaction ID missing"
            );


            return res.redirect(

                `${FRONTEND_URL}/doctor/subscription/failure?error=transaction_id_missing`

            );

        }


        console.log(
            "Easebuzz transaction ID:",
            txnid
        );


        // =================================================
        // 2. FIND OUR TRANSACTION
        // =================================================

        const transaction =
            await PaymentTransaction.findOne({

                transactionId:
                    txnid,

            });


        if (!transaction) {

            console.error(
                "PaymentTransaction not found:",
                txnid
            );


            return res.redirect(

                `${FRONTEND_URL}/doctor/subscription/failure?error=transaction_not_found&txnid=${encodeURIComponent(txnid)}`

            );

        }


        console.log(
            "Local transaction found:",
            transaction._id
        );


        // =================================================
        // 3. VERIFY EASEBUZZ HASH
        // =================================================

        /*
         * IMPORTANT:
         *
         * Do NOT use the old
         * verifyEasebuzzResponseHash()
         *
         * Use the SAME verification function
         * from easebuzzService.js.
         *
         * It already contains the proper
         * reverse hash sequence.
         */

        const hashValid =
            verifyEasebuzzResponse(
                paymentData
            );


        console.log(
            "Easebuzz hash valid:",
            hashValid
        );


        if (!hashValid) {

            console.error(
                "Invalid Easebuzz response hash"
            );


            transaction.status =
                "failed";


            transaction.paymentResponse =
                paymentData;


            await transaction.save();


            return res.redirect(

                `${FRONTEND_URL}/doctor/subscription/failure?error=invalid_hash&txnid=${encodeURIComponent(txnid)}`

            );

        }


        // =================================================
        // 4. CHECK PAYMENT STATUS
        // =================================================

        const gatewayStatus =
            String(
                paymentData.status || ""
            )
                .trim()
                .toLowerCase();


        console.log(
            "Gateway payment status:",
            gatewayStatus
        );


        if (
            gatewayStatus !== "success"
        ) {

            transaction.status =
                "failed";


            transaction.paymentResponse =
                paymentData;


            await transaction.save();


            return res.redirect(

                `${FRONTEND_URL}/doctor/subscription/failure?error=payment_failed&txnid=${encodeURIComponent(txnid)}`

            );

        }


        // =================================================
        // 5. VERIFY AMOUNT
        // =================================================

        const receivedAmount =
            Number(
                paymentData.amount
            );


        const expectedAmount =
            Number(
                transaction.amount
            );


        console.log(
            "Amount verification:",
            {
                receivedAmount,
                expectedAmount,
            }
        );


        if (
            !Number.isFinite(
                receivedAmount
            ) ||
            receivedAmount !==
            expectedAmount
        ) {

            console.error(
                "Payment amount mismatch"
            );


            transaction.status =
                "failed";


            transaction.paymentResponse =
                paymentData;


            await transaction.save();


            return res.redirect(

                `${FRONTEND_URL}/doctor/subscription/failure?error=amount_mismatch&txnid=${encodeURIComponent(txnid)}`

            );

        }


        // =================================================
        // 6. GET PLAN FROM TRANSACTION
        // =================================================

        const plan =
            DOCTOR_PLANS[
            transaction.planId
            ];


        if (!plan) {

            console.error(
                "Plan not found:",
                transaction.planId
            );


            transaction.status =
                "failed";


            transaction.paymentResponse =
                paymentData;


            await transaction.save();


            return res.redirect(

                `${FRONTEND_URL}/doctor/subscription/failure?error=plan_not_found&txnid=${encodeURIComponent(txnid)}`

            );

        }


        // =================================================
        // 7. GET DOCTOR
        // =================================================

        const doctor =
            await User.findOne({

                _id:
                    transaction.userId,

                role:
                    "doctor",

            });


        if (!doctor) {

            console.error(
                "Doctor not found:",
                transaction.userId
            );


            transaction.status =
                "failed";


            transaction.paymentResponse =
                paymentData;


            await transaction.save();


            return res.redirect(

                `${FRONTEND_URL}/doctor/subscription/failure?error=doctor_not_found&txnid=${encodeURIComponent(txnid)}`

            );

        }


        // =================================================
        // 8. ACTIVATE SUBSCRIPTION
        // =================================================

        const subscription =
            await activateSubscription(

                transaction,

                plan,

                paymentData

            );


        // =========================================
        // SUCCESS EMAIL
        // =========================================

        try {

            await sendSubscriptionSuccessEmail({

                email: doctor.email,

                firstName:
                    doctor.firstName || "Doctor",

                planName:
                    subscription.planName,

                amount:
                    transaction.amount,

                transactionId:
                    transaction.transactionId,

                endDate:
                    subscription.endDate,

            });

            console.log(
                "Subscription success email sent."
            );

        } catch (emailError) {

            console.error(
                "Subscription success email failed:",
                emailError.message
            );

        }


        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            "SUBSCRIPTION ACTIVATED"
        );

        console.log({

            transactionId:
                transaction.transactionId,

            planId:
                subscription.planId,

            planName:
                subscription.planName,

            status:
                subscription.status,

            startDate:
                subscription.startDate,

            endDate:
                subscription.endDate,

        });

        console.log(
            "========================================"
        );


        // =================================================
        // 9. SUCCESS PAGE
        // =================================================

        return res.redirect(

            `${FRONTEND_URL}/doctor/subscription/success` +

            `?txnid=${encodeURIComponent(
                transaction.transactionId
            )}` +

            `&plan=${encodeURIComponent(
                subscription.planId
            )}` +

            `&planName=${encodeURIComponent(
                subscription.planName
            )}`

        );

    }

    catch (error) {

        console.error(
            "Payment verification error:",
            error
        );


        /*
         * If transaction exists, try to mark it failed.
         */

        try {

            const paymentData = {

                ...(req.query || {}),

                ...(req.body || {}),

            };


            const txnid =
                paymentData.txnid;


            if (txnid) {

                const transaction =
                    await PaymentTransaction.findOne({

                        transactionId:
                            txnid,

                    });


                if (
                    transaction &&
                    transaction.status !==
                    "success"
                ) {

                    transaction.status =
                        "failed";


                    transaction.paymentResponse =
                        paymentData;


                    await transaction.save();

                }

            }

        }

        catch (
        updateError
        ) {

            console.error(
                "Failed to update transaction after error:",
                updateError
            );

        }


        return res.redirect(

            `${FRONTEND_URL}/doctor/subscription/failure?error=payment_verification_failed`

        );

    }

};


// =========================================================
// PAYMENT FAILURE CALLBACK
// =========================================================

const paymentFailure = async (
    req,
    res
) => {

    try {

        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            "EASEBUZZ FAILURE CALLBACK"
        );

        console.log(
            "BODY:",
            req.body
        );

        console.log(
            "QUERY:",
            req.query
        );

        console.log(
            "========================================"
        );


        const paymentData = {

            ...(req.query || {}),

            ...(req.body || {}),

        };


        const txnid =
            String(
                paymentData.txnid || ""
            ).trim();


        if (!txnid) {

            return res.redirect(

                `${FRONTEND_URL}/doctor/subscription/failure?error=transaction_id_missing`

            );

        }


        const transaction =
            await PaymentTransaction.findOne({

                transactionId:
                    txnid,

            });


        if (transaction) {

            transaction.status =
                "failed";


            transaction.easebuzzTransactionId =
                paymentData.easepayid ||
                null;


            transaction.paymentResponse =
                paymentData;


            await transaction.save();

            try {

                const doctor =
                    await User.findById(
                        transaction.userId
                    );

                const plan =
                    DOCTOR_PLANS[
                    transaction.planId
                    ];

                if (doctor?.email) {

                    await sendSubscriptionFailureEmail({

                        email:
                            doctor.email,

                        firstName:
                            doctor.firstName ||
                            "Doctor",

                        planName:
                            plan?.name ||
                            "Subscription",

                        transactionId:
                            transaction.transactionId,

                    });

                    console.log(
                        "Subscription failure email sent."
                    );

                }

            } catch (emailError) {

                console.error(
                    "Subscription failure email error:",
                    emailError.message
                );

            }

        }


        return res.redirect(

            `${FRONTEND_URL}/doctor/subscription/failure` +

            `?txnid=${encodeURIComponent(
                txnid
            )}`

        );

    }

    catch (error) {

        console.error(
            "Payment failure error:",
            error
        );


        return res.redirect(

            `${FRONTEND_URL}/doctor/subscription/failure?error=payment_failure_processing`

        );

    }

};


// =========================================================
// ACTIVATE SUBSCRIPTION
// =========================================================

const activateSubscription = async (
    transaction,
    plan,
    paymentData
) => {

    const now =
        new Date();


    const durationDays =
        Number(
            plan.durationDays || 30
        );


    const endDate =
        new Date(now);


    endDate.setDate(
        endDate.getDate() +
        durationDays
    );


    // =================================================
    // FIND EXISTING SUBSCRIPTION
    // =================================================

    let subscription =
        await DoctorSubscription.findOne({

            userId:
                transaction.userId,

        });


    // =================================================
    // CREATE
    // =================================================

    if (!subscription) {

        subscription =
            await DoctorSubscription.create({

                userId:
                    transaction.userId,

                planId:
                    plan.id,

                planName:
                    plan.name,

                status:
                    "active",

                price:
                    Number(plan.price),

                startDate:
                    now,

                endDate,

                features:
                    plan.features,

                autoRenew:
                    false,

                transactionId:
                    transaction.transactionId,

                paymentId:
                    paymentData?.easepayid ||
                    null,

            });

    }

    // =================================================
    // UPDATE EXISTING
    // =================================================

    else {

        subscription.planId =
            plan.id;


        subscription.planName =
            plan.name;


        subscription.status =
            "active";


        subscription.price =
            Number(plan.price);


        subscription.startDate =
            now;


        subscription.endDate =
            endDate;


        subscription.features =
            plan.features;


        subscription.autoRenew =
            false;


        subscription.transactionId =
            transaction.transactionId;


        subscription.paymentId =
            paymentData?.easepayid ||
            null;


        await subscription.save();

    }


    // =================================================
    // UPDATE PAYMENT TRANSACTION
    // =================================================

    transaction.subscriptionId =
        subscription._id;


    transaction.status =
        "success";


    transaction.easebuzzTransactionId =
        paymentData?.easepayid ||
        null;


    transaction.paymentResponse =
        paymentData;


    transaction.paidAt =
        now;


    await transaction.save();


    return subscription;

};


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    getSubscription,

    createPayment,

    paymentSuccess,

    paymentFailure,

    activateSubscription,

};