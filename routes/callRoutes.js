const express = require("express");

const {
    createCall,
    getCall,
    endCall,
} = require("../controllers/callController");

const protect =
    require("../middleware/authMiddleware");

const router = express.Router();


// =========================================================
// CREATE / JOIN CALL
// POST /api/calls/create
// =========================================================

router.post(
    "/create",
    protect,
    createCall
);


// =========================================================
// GET CALL
// GET /api/calls/:appointmentId
// =========================================================

router.get(
    "/:appointmentId",
    protect,
    getCall
);


// =========================================================
// END CALL
// POST /api/calls/end
// =========================================================

router.post(
    "/end",
    protect,
    endCall
);


module.exports = router;