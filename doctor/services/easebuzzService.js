const crypto = require("crypto");

const EASEBUZZ_KEY = process.env.EASEBUZZ_KEY;
const EASEBUZZ_SALT = process.env.EASEBUZZ_SALT;
const EASEBUZZ_ENV = process.env.EASEBUZZ_ENV || "sandbox";

const INITIATE_PAYMENT_URL =
    EASEBUZZ_ENV === "production"
        ? "https://pay.easebuzz.in/payment/initiateLink"
        : "https://testpay.easebuzz.in/payment/initiateLink";

const CHECKOUT_URL =
    EASEBUZZ_ENV === "production"
        ? "https://pay.easebuzz.in/pay/"
        : "https://testpay.easebuzz.in/pay/";


/* =====================================================
   GENERATE REQUEST HASH
===================================================== */

const generateEasebuzzHash = (data) => {

    const hashString = [
        EASEBUZZ_KEY,
        data.txnid,
        data.amount,
        data.productinfo,
        data.firstname,
        data.email,

        data.udf1 || "",
        data.udf2 || "",
        data.udf3 || "",
        data.udf4 || "",
        data.udf5 || "",
        data.udf6 || "",
        data.udf7 || "",
        data.udf8 || "",
        data.udf9 || "",
        data.udf10 || "",

        EASEBUZZ_SALT,
    ].join("|");

    console.log("\n========== EASEBUZZ HASH ==========");
    console.log("Hash fields:");
    console.log({
        key: EASEBUZZ_KEY ? "CONFIGURED" : "MISSING",
        txnid: data.txnid,
        amount: data.amount,
        productinfo: data.productinfo,
        firstname: data.firstname,
        email: data.email,
    });

    console.log("====================================\n");

    return crypto
        .createHash("sha512")
        .update(hashString)
        .digest("hex");
};


/* =====================================================
   VERIFY RESPONSE HASH
===================================================== */

const verifyEasebuzzResponse = (data) => {

    try {

        if (!data) {
            return false;
        }

        if (!data.status) {
            return false;
        }

        if (!data.hash) {
            return false;
        }


        const reverseHashString = [

            EASEBUZZ_SALT,

            data.status || "",

            data.udf10 || "",
            data.udf9 || "",
            data.udf8 || "",
            data.udf7 || "",
            data.udf6 || "",
            data.udf5 || "",
            data.udf4 || "",
            data.udf3 || "",
            data.udf2 || "",
            data.udf1 || "",

            data.email || "",

            data.firstname || "",

            data.productinfo || "",

            data.amount || "",

            data.txnid || "",

            data.key || "",

        ].join("|");


        const generatedHash =
            crypto
                .createHash("sha512")
                .update(reverseHashString)
                .digest("hex");


        const receivedHash =
            String(data.hash)
                .trim()
                .toLowerCase();


        const generated =
            generatedHash
                .trim()
                .toLowerCase();


        console.log(
            "========== EASEBUZZ RESPONSE HASH =========="
        );


        console.log({

            receivedHash,

            generatedHash:
                generated,

            match:
                receivedHash ===
                generated,

        });


        console.log(
            "============================================"
        );


        return (
            receivedHash ===
            generated
        );

    }

    catch (error) {

        console.error(
            "Easebuzz response hash verification error:",
            error
        );

        return false;

    }

};

/* =====================================================
   CREATE EASEBUZZ PAYMENT
===================================================== */

const createEasebuzzPayment = async ({
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone,
    surl,
    furl,
}) => {

    /* =================================================
       1. CHECK CREDENTIALS
    ================================================= */

    if (!EASEBUZZ_KEY) {
        throw new Error(
            "EASEBUZZ_KEY is missing in .env"
        );
    }

    if (!EASEBUZZ_SALT) {
        throw new Error(
            "EASEBUZZ_SALT is missing in .env"
        );
    }


    /* =================================================
       2. CLEAN VALUES
    ================================================= */

    const cleanTxnid =
        String(txnid || "").trim();

    const cleanAmount =
        Number(amount);

    const cleanProductInfo =
        String(productinfo || "")
            .trim();

    const cleanFirstname =
        String(firstname || "Doctor")
            .trim()
            .replace(
                /[^a-zA-Z0-9 ]/g,
                ""
            )
            .substring(0, 50);

    const cleanEmail =
        String(email || "")
            .trim()
            .toLowerCase();

    const cleanPhone =
        String(phone || "")
            .replace(/\D/g, "")
            .slice(-10);

    const cleanSurl =
        String(surl || "")
            .trim();

    const cleanFurl =
        String(furl || "")
            .trim();


    /* =================================================
       3. VALIDATION
    ================================================= */

    if (!cleanTxnid) {
        throw new Error(
            "Easebuzz txnid is missing."
        );
    }

    if (
        !Number.isFinite(cleanAmount) ||
        cleanAmount <= 0
    ) {
        throw new Error(
            "Easebuzz amount is invalid."
        );
    }

    if (!cleanProductInfo) {
        throw new Error(
            "Easebuzz productinfo is missing."
        );
    }

    if (!cleanFirstname) {
        throw new Error(
            "Easebuzz firstname is missing."
        );
    }

    if (
        !cleanEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            cleanEmail
        )
    ) {
        throw new Error(
            `Invalid doctor email for Easebuzz: ${cleanEmail}`
        );
    }

    /*
     * Phone ko optional rakho.
     *
     * Agar tumhare User model me phone missing hai,
     * to pehle payment request ko phone validation ke
     * wajah se fail mat karo.
     */

    if (
        cleanPhone &&
        !/^[6-9]\d{9}$/.test(cleanPhone)
    ) {
        throw new Error(
            `Invalid doctor phone for Easebuzz: ${cleanPhone}`
        );
    }

    if (!cleanSurl) {
        throw new Error(
            "Easebuzz success URL is missing."
        );
    }

    if (!cleanFurl) {
        throw new Error(
            "Easebuzz failure URL is missing."
        );
    }


    /* =================================================
       4. PAYMENT DATA
    ================================================= */

    const paymentData = {

        key: EASEBUZZ_KEY,

        txnid: cleanTxnid,

        amount: cleanAmount.toFixed(2),

        productinfo: cleanProductInfo,

        firstname: cleanFirstname,

        email: cleanEmail,

        phone: cleanPhone || "9999999999",

        surl: cleanSurl,

        furl: cleanFurl,

        udf1: "",
        udf2: "",
        udf3: "",
        udf4: "",
        udf5: "",
        udf6: "",
        udf7: "",
        udf8: "",
        udf9: "",
        udf10: "",
    };


    /* =================================================
       5. GENERATE HASH
    ================================================= */

    paymentData.hash =
        generateEasebuzzHash(
            paymentData
        );


    /* =================================================
       6. DEBUG REQUEST
    ================================================= */

    console.log("\n");
    console.log("==========================================");
    console.log("        EASEBUZZ PAYMENT REQUEST");
    console.log("==========================================");

    console.log({
        environment: EASEBUZZ_ENV,

        key:
            EASEBUZZ_KEY
                ? "CONFIGURED"
                : "MISSING",

        salt:
            EASEBUZZ_SALT
                ? "CONFIGURED"
                : "MISSING",

        txnid:
            paymentData.txnid,

        amount:
            paymentData.amount,

        productinfo:
            paymentData.productinfo,

        firstname:
            paymentData.firstname,

        email:
            paymentData.email,

        phone:
            paymentData.phone,

        surl:
            paymentData.surl,

        furl:
            paymentData.furl,

        hash:
            paymentData.hash,
    });

    console.log(
        "Initiate URL:",
        INITIATE_PAYMENT_URL
    );

    console.log("==========================================");
    console.log("\n");


    /* =================================================
       7. CREATE FORM BODY
    ================================================= */

    const body =
        new URLSearchParams();

    Object.entries(paymentData).forEach(
        ([key, value]) => {

            body.append(
                key,
                String(value)
            );

        }
    );


    /* =================================================
       8. CALL EASEBUZZ
    ================================================= */

    let response;

    try {

        response =
            await fetch(
                INITIATE_PAYMENT_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",

                        Accept:
                            "application/json",
                    },

                    body:
                        body.toString(),
                }
            );

    } catch (error) {

        console.error(
            "Easebuzz network error:",
            error
        );

        throw new Error(
            "Unable to connect to Easebuzz."
        );
    }


    /* =================================================
       9. READ RESPONSE
    ================================================= */

    const rawResponse =
        await response.text();

    console.log("\n");
    console.log(
        "=========================================="
    );

    console.log(
        "EASEBUZZ RESPONSE"
    );

    console.log(
        "HTTP STATUS:",
        response.status
    );

    console.log(
        "RAW RESPONSE:",
        rawResponse
    );

    console.log(
        "=========================================="
    );
    console.log("\n");


    /* =================================================
       10. HTTP ERROR
    ================================================= */

    if (!response.ok) {

        throw new Error(
            `Easebuzz HTTP error: ${response.status} - ${rawResponse}`
        );
    }


    /* =================================================
       11. PARSE RESPONSE
    ================================================= */

    let responseData;

    try {

        responseData =
            JSON.parse(
                rawResponse
            );

    } catch (error) {

        throw new Error(
            `Easebuzz returned invalid JSON: ${rawResponse}`
        );
    }


    console.log(
        "EASEBUZZ PARSED RESPONSE:"
    );

    console.dir(
        responseData,
        {
            depth: null,
        }
    );


    /* =================================================
       12. CHECK STATUS
    ================================================= */

    const gatewayStatus =
        Number(
            responseData?.status
        );


    if (
        gatewayStatus !== 1
    ) {

        const gatewayMessage =
            responseData?.message ||
            responseData?.error ||
            responseData?.data ||
            "Easebuzz rejected payment parameters.";

        console.error(
            "=========================================="
        );

        console.error(
            "EASEBUZZ PAYMENT REJECTED"
        );

        console.error(
            "Reason:",
            gatewayMessage
        );

        console.error(
            "Full response:",
            responseData
        );

        console.error(
            "=========================================="
        );


        return {

            success: false,

            message:
                String(
                    gatewayMessage
                ),

            rawResponse:
                responseData,
        };
    }


    /* =================================================
       13. GET ACCESS KEY
    ================================================= */

    const accessKey =
        typeof responseData?.data === "string"
            ? responseData.data.trim()
            : "";


    if (!accessKey) {

        return {

            success: false,

            message:
                "Easebuzz did not return an access key.",

            rawResponse:
                responseData,
        };
    }


    /* =================================================
       14. REJECT ERROR STRING
    ================================================= */

    if (
        accessKey
            .toLowerCase()
            .includes(
                "parameter validation failed"
            )
    ) {

        return {

            success: false,

            message:
                "Easebuzz parameter validation failed.",

            rawResponse:
                responseData,
        };
    }


    /* =================================================
       15. PAYMENT URL
    ================================================= */

    const paymentUrl =
        CHECKOUT_URL +
        encodeURIComponent(
            accessKey
        );


    /* =================================================
       16. SUCCESS
    ================================================= */

    console.log(
        "=========================================="
    );

    console.log(
        "EASEBUZZ PAYMENT CREATED"
    );

    console.log(
        "Transaction:",
        cleanTxnid
    );

    console.log(
        "Access Key:",
        accessKey
    );

    console.log(
        "Payment URL:",
        paymentUrl
    );

    console.log(
        "=========================================="
    );


    return {

        success: true,

        accessKey,

        paymentUrl,

        rawResponse:
            responseData,
    };
};


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

    generateEasebuzzHash,

    verifyEasebuzzResponse,

    createEasebuzzPayment,
};