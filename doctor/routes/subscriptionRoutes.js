const express = require("express");

const {
    getSubscription,
    createPayment,
    paymentSuccess,
    paymentFailure,
} = require("../controllers/subscriptionController");

const authMiddleware =
    require("../../middleware/authMiddleware");

const router =
    express.Router();


// =====================================================
// GET CURRENT SUBSCRIPTION
// =====================================================

router.get(
    "/subscription",
    authMiddleware,
    getSubscription
);


// =====================================================
// CREATE PAYMENT
// =====================================================

router.post(
    "/subscription/create-payment",
    authMiddleware,
    createPayment
);


// =====================================================
// EASEBUZZ SUCCESS CALLBACK
// IMPORTANT: NO AUTH MIDDLEWARE
// =====================================================

router.post(
    "/subscription/payment/success",
    paymentSuccess
);


// =====================================================
// EASEBUZZ FAILURE CALLBACK
// IMPORTANT: NO AUTH MIDDLEWARE
// =====================================================

router.post(
    "/subscription/payment/failure",
    paymentFailure
);


module.exports = router;