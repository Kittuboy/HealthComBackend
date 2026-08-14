// =========================================================
// HEALTHCOM EMAIL SERVICE
// BREVO HTTP API
// =========================================================

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// =========================================================
// ENVIRONMENT VALIDATION
// =========================================================

function validateEmailConfig() {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is missing");
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is missing");
  }
}

// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =========================================================
// SAFE VALUE
// =========================================================

function safeValue(value, fallback = "") {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return escapeHtml(value);
}

// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(date) {
  if (!date) {
    return "N/A";
  }

  try {
    return new Date(date).toLocaleDateString("en-IN");
  } catch (error) {
    return String(date);
  }
}

// =========================================================
// BREVO HTTP API EMAIL SENDER
// =========================================================

async function sendEmail({
  to,
  subject,
  text,
  html,
}) {
  try {
    validateEmailConfig();

    if (!to) {
      throw new Error("Recipient email is missing");
    }

    if (!subject) {
      throw new Error("Email subject is missing");
    }

    const response = await fetch(BREVO_API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        Accept: "application/json",
      },

      body: JSON.stringify({
        sender: {
          name: "HealthCom",
          email: process.env.EMAIL_FROM,
        },

        to: [
          {
            email: to,
          },
        ],

        subject,

        textContent:
          text || "This email requires an HTML-compatible email client.",

        htmlContent:
          html ||
          `<p>${escapeHtml(
            text || "This email requires an HTML-compatible email client."
          )}</p>`,
      }),
    });

    let data = {};

    try {
      data = await response.json();
    } catch (jsonError) {
      data = {};
    }

    if (!response.ok) {
      console.error("==============================================");
      console.error("❌ BREVO API EMAIL FAILED");
      console.error("📧 To:", to);
      console.error("📌 Subject:", subject);
      console.error("❌ HTTP Status:", response.status);
      console.error("❌ Response:", data);
      console.error("==============================================");

      throw new Error(
        data?.message ||
          data?.code ||
          `Brevo API request failed with status ${response.status}`
      );
    }

    console.log("==============================================");
    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("📧 To:", to);
    console.log("📌 Subject:", subject);
    console.log("📨 Message ID:", data?.messageId || "N/A");
    console.log("==============================================");

    return data;
  } catch (error) {
    console.error("==============================================");
    console.error("❌ EMAIL SENDING FAILED");
    console.error("📧 To:", to || "Unknown");
    console.error("📌 Subject:", subject || "Unknown");
    console.error("❌ Error:", error.message);
    console.error("==============================================");

    throw error;
  }
}

// =========================================================
// VERIFICATION OTP
// =========================================================

async function sendVerificationOtp({
  email,
  firstName,
  otp,
}) {
  const name = safeValue(firstName, "User");
  const safeOtp = safeValue(otp);

  const text = `Hello ${firstName || "User"},

Your HealthCom verification OTP is: ${otp}

This OTP expires in 5 minutes.

If you did not create this account, please ignore this email.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your HealthCom account</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f3f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#333;
">

  <div style="
    width:100%;
    padding:35px 15px;
    box-sizing:border-box;
  ">

    <div style="
      max-width:600px;
      margin:auto;
      background:#ffffff;
      border:1px solid #e5eaf1;
      border-radius:16px;
      padding:35px;
    ">

      <h1 style="
        margin:0 0 25px;
        color:#0878d1;
      ">
        HealthCom
      </h1>

      <p style="font-size:16px;">
        Hello ${name},
      </p>

      <p style="
        color:#4b5563;
        line-height:1.7;
      ">
        Your email verification OTP is:
      </p>

      <div style="
        margin:25px 0;
        padding:20px;
        text-align:center;
        background:#f0f7ff;
        border:1px solid #d7eaff;
        border-radius:12px;
      ">

        <div style="
          color:#0878d1;
          font-size:32px;
          font-weight:700;
          letter-spacing:8px;
        ">
          ${safeOtp}
        </div>

      </div>

      <p style="
        color:#6b7280;
        line-height:1.7;
      ">
        This OTP expires in 5 minutes.
      </p>

      <p style="
        color:#6b7280;
        line-height:1.7;
      ">
        If you did not create this account,
        please ignore this email.
      </p>

      <hr style="
        border:0;
        border-top:1px solid #edf1f5;
        margin:30px 0;
      ">

      <p style="
        margin:0;
        text-align:center;
        color:#9ca3af;
        font-size:12px;
      ">
        © ${new Date().getFullYear()} HealthCom. All rights reserved.
      </p>

    </div>

  </div>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "Verify your HealthCom account",
    text,
    html,
  });
}

// =========================================================
// LOGIN OTP
// =========================================================

async function sendLoginOtp({
  email,
  firstName,
  otp,
}) {
  const name = safeValue(firstName, "User");
  const safeOtp = safeValue(otp);

  const text = `Hello ${firstName || "User"},

Your HealthCom login OTP is: ${otp}

This OTP expires in 5 minutes.

If you did not request this login, please ignore this email.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HealthCom Login OTP</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f3f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#333;
">

  <div style="
    width:100%;
    padding:35px 15px;
    box-sizing:border-box;
  ">

    <div style="
      max-width:600px;
      margin:auto;
      background:#ffffff;
      border:1px solid #e5eaf1;
      border-radius:16px;
      padding:35px;
    ">

      <h1 style="
        margin:0;
        color:#0878d1;
      ">
        HealthCom
      </h1>

      <h2 style="
        color:#111827;
        margin-top:25px;
      ">
        Login Verification
      </h2>

      <p style="font-size:16px;">
        Hello ${name},
      </p>

      <p style="
        color:#4b5563;
        line-height:1.7;
      ">
        Your HealthCom login OTP is:
      </p>

      <div style="
        margin:25px 0;
        padding:20px;
        text-align:center;
        background:#f0f7ff;
        border:1px solid #d7eaff;
        border-radius:12px;
      ">

        <div style="
          color:#0878d1;
          font-size:32px;
          font-weight:700;
          letter-spacing:8px;
        ">
          ${safeOtp}
        </div>

      </div>

      <p style="
        color:#6b7280;
        line-height:1.7;
      ">
        This OTP expires in 5 minutes.
      </p>

      <p style="
        color:#6b7280;
        line-height:1.7;
      ">
        If you did not request this login,
        please ignore this email.
      </p>

      <hr style="
        border:0;
        border-top:1px solid #edf1f5;
        margin:30px 0;
      ">

      <p style="
        margin:0;
        text-align:center;
        color:#9ca3af;
        font-size:12px;
      ">
        © ${new Date().getFullYear()} HealthCom. All rights reserved.
      </p>

    </div>

  </div>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "HealthCom Login OTP",
    text,
    html,
  });
}

// =========================================================
// PASSWORD RESET OTP
// =========================================================

async function sendPasswordResetOtp({
  email,
  firstName,
  otp,
}) {
  const name = safeValue(firstName, "User");
  const safeOtp = safeValue(otp);

  const text = `Hello ${firstName || "User"},

Your HealthCom password reset OTP is: ${otp}

This OTP expires in 5 minutes.

If you did not request a password reset, please ignore this email.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HealthCom Password Reset</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f3f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#333;
">

  <div style="
    width:100%;
    padding:35px 15px;
  ">

    <div style="
      max-width:600px;
      margin:auto;
      background:#ffffff;
      border:1px solid #e5eaf1;
      border-radius:16px;
      padding:35px;
    ">

      <h1 style="color:#0878d1;">
        HealthCom
      </h1>

      <h2 style="color:#111827;">
        Password Reset
      </h2>

      <p>
        Hello ${name},
      </p>

      <p style="
        color:#4b5563;
        line-height:1.7;
      ">
        Your HealthCom password reset OTP is:
      </p>

      <div style="
        margin:25px 0;
        padding:20px;
        text-align:center;
        background:#f0f7ff;
        border:1px solid #d7eaff;
        border-radius:12px;
      ">

        <div style="
          color:#0878d1;
          font-size:32px;
          font-weight:700;
          letter-spacing:8px;
        ">
          ${safeOtp}
        </div>

      </div>

      <p style="
        color:#6b7280;
        line-height:1.7;
      ">
        This OTP expires in 5 minutes.
      </p>

      <p style="
        color:#6b7280;
        line-height:1.7;
      ">
        If you did not request a password reset,
        please ignore this email.
      </p>

      <hr style="
        border:0;
        border-top:1px solid #edf1f5;
        margin:30px 0;
      ">

      <p style="
        text-align:center;
        color:#9ca3af;
        font-size:12px;
      ">
        © ${new Date().getFullYear()} HealthCom. All rights reserved.
      </p>

    </div>

  </div>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "HealthCom Password Reset OTP",
    text,
    html,
  });
}

// =========================================================
// PATIENT APPOINTMENT REQUEST EMAIL
// =========================================================

async function sendPatientAppointmentEmail({
  email,
  firstName,
  doctorName,
  specialty,
  appointmentDate,
  appointmentTime,
}) {
  const name = safeValue(firstName, "Patient");
  const doctor = safeValue(doctorName, "Doctor");
  const spec = safeValue(specialty, "N/A");
  const date = safeValue(appointmentDate, "N/A");
  const time = safeValue(appointmentTime, "N/A");

  const text = `Hello ${firstName || "Patient"},

Your appointment request with ${doctorName} has been submitted successfully.

Doctor: ${doctorName}
Specialization: ${specialty}
Date: ${appointmentDate}
Time: ${appointmentTime}

Your request is currently pending doctor approval.

You will receive another email when the doctor accepts or rejects the request.

Thank you for choosing HealthCom.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Appointment Request Received</title>
</head>

<body style="
margin:0;
padding:0;
background:#f3f7fb;
font-family:Arial,Helvetica,sans-serif;
color:#1f2937;
">

<div style="
width:100%;
padding:32px 14px;
box-sizing:border-box;
">

<div style="
max-width:620px;
margin:0 auto;
background:#ffffff;
border:1px solid #e5eaf1;
border-radius:18px;
overflow:hidden;
">

<div style="
background:#0878d1;
padding:30px;
color:#ffffff;
">

<div style="
font-size:13px;
letter-spacing:1.5px;
text-transform:uppercase;
font-weight:700;
">
HealthCom
</div>

<h1 style="
margin:8px 0 0;
font-size:26px;
">
Appointment Request Received
</h1>

</div>

<div style="padding:30px;">

<div style="
display:inline-block;
padding:9px 14px;
background:#fff7ed;
color:#c2410c;
border:1px solid #fed7aa;
border-radius:999px;
font-size:13px;
font-weight:700;
">
● Request Pending
</div>

<p style="
margin:24px 0 10px;
font-size:16px;
">
Hello ${name},
</p>

<p style="
margin:0;
color:#4b5563;
font-size:15px;
line-height:1.7;
">
Your appointment request has been sent successfully.
The doctor will review your request and you will
receive a separate notification once a decision is made.
</p>

<div style="
margin:24px 0;
padding:22px;
background:#f8fbff;
border:1px solid #e1edf9;
border-radius:14px;
">

<div style="
font-size:13px;
color:#6b7280;
font-weight:700;
text-transform:uppercase;
margin-bottom:16px;
">
Appointment Details
</div>

<p style="margin:10px 0;">
<strong>Doctor:</strong> ${doctor}
</p>

<p style="margin:10px 0;">
<strong>Specialization:</strong> ${spec}
</p>

<p style="margin:10px 0;">
<strong>Date:</strong> ${date}
</p>

<p style="margin:10px 0;">
<strong>Time:</strong> ${time}
</p>

</div>

<div style="
padding:15px 17px;
background:#f0fdf4;
border:1px solid #bbf7d0;
border-radius:12px;
color:#166534;
font-size:14px;
line-height:1.6;
">

<strong>What happens next?</strong>

<br>

Your request is waiting for doctor approval.
Please check your HealthCom account for the latest
appointment status.

</div>

<p style="
margin:25px 0 0;
color:#6b7280;
font-size:13px;
">
Thank you for choosing
<strong style="color:#0878d1;">
HealthCom
</strong>.
</p>

</div>

<div style="
padding:20px 30px;
background:#f8fafc;
border-top:1px solid #edf1f5;
text-align:center;
color:#9ca3af;
font-size:12px;
">
© ${new Date().getFullYear()} HealthCom. All rights reserved.
</div>

</div>
</div>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "HealthCom - Appointment Request Received",
    text,
    html,
  });
}

// =========================================================
// DOCTOR APPOINTMENT REQUEST EMAIL
// =========================================================

async function sendDoctorAppointmentEmail({
  email,
  firstName,
  patientName,
  patientEmail,
  patientPhone,
  doctorName,
  appointmentDate,
  appointmentTime,
}) {
  const name = safeValue(firstName, "Doctor");
  const patient = safeValue(patientName, "Patient");
  const pEmail = safeValue(patientEmail, "Not provided");
  const phone = safeValue(patientPhone, "Not provided");
  const doctor = safeValue(doctorName, "Doctor");
  const date = safeValue(appointmentDate, "N/A");
  const time = safeValue(appointmentTime, "N/A");

  const text = `Hello ${firstName || "Doctor"},

You have received a new appointment request through HealthCom.

Patient: ${patientName}
Patient Email: ${patientEmail}
Patient Phone: ${patientPhone || "Not provided"}

Doctor: ${doctorName}
Date: ${appointmentDate}
Time: ${appointmentTime}

Please open your HealthCom dashboard to review and accept or reject this appointment request.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>New Appointment Request</title>
</head>

<body style="
margin:0;
padding:0;
background:#f3f7fb;
font-family:Arial,Helvetica,sans-serif;
color:#1f2937;
">

<div style="
width:100%;
padding:32px 14px;
box-sizing:border-box;
">

<div style="
max-width:620px;
margin:0 auto;
background:#ffffff;
border:1px solid #e5eaf1;
border-radius:18px;
overflow:hidden;
">

<div style="
background:#0878d1;
padding:30px;
color:#ffffff;
">

<div style="
font-size:13px;
letter-spacing:1.5px;
text-transform:uppercase;
font-weight:700;
">
HealthCom
</div>

<h1 style="
margin:8px 0 0;
font-size:26px;
">
New Appointment Request
</h1>

</div>

<div style="padding:30px;">

<div style="
display:inline-block;
padding:9px 14px;
background:#eff6ff;
color:#1d4ed8;
border:1px solid #bfdbfe;
border-radius:999px;
font-size:13px;
font-weight:700;
">
● Action Required
</div>

<p style="
margin:24px 0 10px;
font-size:16px;
">
Hello ${name},
</p>

<p style="
margin:0;
color:#4b5563;
font-size:15px;
line-height:1.7;
">
A patient has submitted a new appointment request.
Please review the details below and choose the
appropriate action from your HealthCom dashboard.
</p>

<div style="
margin:24px 0;
padding:22px;
background:#f8fbff;
border:1px solid #e1edf9;
border-radius:14px;
">

<div style="
font-size:13px;
color:#6b7280;
font-weight:700;
text-transform:uppercase;
margin-bottom:16px;
">
Patient Details
</div>

<p style="margin:10px 0;">
<strong>Patient:</strong> ${patient}
</p>

<p style="margin:10px 0;">
<strong>Email:</strong> ${pEmail}
</p>

<p style="margin:10px 0;">
<strong>Phone:</strong> ${phone}
</p>

</div>

<div style="
padding:22px;
background:#f8fafc;
border:1px solid #e5e7eb;
border-radius:14px;
">

<div style="
font-size:13px;
color:#6b7280;
font-weight:700;
text-transform:uppercase;
margin-bottom:16px;
">
Appointment Details
</div>

<p style="margin:10px 0;">
<strong>Doctor:</strong> ${doctor}
</p>

<p style="margin:10px 0;">
<strong>Date:</strong> ${date}
</p>

<p style="margin:10px 0;">
<strong>Time:</strong> ${time}
</p>

</div>

<div style="
margin-top:24px;
padding:15px 17px;
background:#fff7ed;
border:1px solid #fed7aa;
border-radius:12px;
color:#9a3412;
font-size:14px;
line-height:1.6;
">

<strong>Pending your decision.</strong>

<br>

Please review this request in your HealthCom
dashboard and accept or reject it.

</div>

</div>

<div style="
padding:20px 30px;
background:#f8fafc;
border-top:1px solid #edf1f5;
text-align:center;
color:#9ca3af;
font-size:12px;
">
© ${new Date().getFullYear()} HealthCom. All rights reserved.
</div>

</div>
</div>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "HealthCom - New Appointment Request",
    text,
    html,
  });
}

// =========================================================
// PATIENT APPOINTMENT CANCELLATION EMAIL
// =========================================================

async function sendPatientAppointmentCancellationEmail({
  email,
  firstName,
  doctorName,
  specialty,
  appointmentDate,
  appointmentTime,
}) {
  const name = safeValue(firstName, "Patient");
  const doctor = safeValue(doctorName, "Doctor");
  const spec = safeValue(specialty, "N/A");
  const date = safeValue(appointmentDate, "N/A");
  const time = safeValue(appointmentTime, "N/A");

  const text = `Hello ${firstName || "Patient"},

Your appointment with ${doctorName} has been cancelled.

Doctor: ${doctorName}
Specialization: ${specialty}
Date: ${appointmentDate}
Time: ${appointmentTime}

You can book another appointment through your HealthCom dashboard.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Appointment Cancelled</title>
</head>

<body style="
margin:0;
padding:0;
background:#f3f7fb;
font-family:Arial,Helvetica,sans-serif;
color:#1f2937;
">

<div style="padding:32px 14px;">

<div style="
max-width:620px;
margin:auto;
background:#ffffff;
border:1px solid #e5e7eb;
border-radius:18px;
overflow:hidden;
">

<div style="
background:#dc2626;
padding:30px;
color:#ffffff;
">

<div style="
font-size:13px;
letter-spacing:1.5px;
text-transform:uppercase;
font-weight:700;
">
HealthCom
</div>

<h1 style="
margin:8px 0 0;
font-size:26px;
">
Appointment Cancelled
</h1>

</div>

<div style="padding:30px;">

<div style="
display:inline-block;
padding:9px 14px;
background:#fef2f2;
color:#b91c1c;
border:1px solid #fecaca;
border-radius:999px;
font-size:13px;
font-weight:700;
">
● Cancelled
</div>

<p style="
margin:24px 0 10px;
font-size:16px;
">
Hello ${name},
</p>

<p style="
color:#4b5563;
font-size:15px;
line-height:1.7;
">
Your appointment has been cancelled successfully.
The appointment details are provided below for your reference.
</p>

<div style="
margin:24px 0;
padding:22px;
background:#fffafa;
border:1px solid #fee2e2;
border-radius:14px;
">

<h3 style="
margin:0 0 16px;
color:#b91c1c;
">
Cancelled Appointment
</h3>

<p><strong>Doctor:</strong> ${doctor}</p>
<p><strong>Specialization:</strong> ${spec}</p>
<p><strong>Date:</strong> ${date}</p>
<p><strong>Time:</strong> ${time}</p>

</div>

<div style="
padding:15px 17px;
background:#eff6ff;
border:1px solid #bfdbfe;
border-radius:12px;
color:#1e40af;
font-size:14px;
line-height:1.6;
">
Need another consultation?
You can search for an available doctor and book
a new appointment from your HealthCom account.
</div>

<p style="
margin:25px 0 0;
color:#6b7280;
font-size:13px;
">
Regards,<br>
<strong style="color:#0878d1;">
HealthCom Team
</strong>
</p>

</div>

<div style="
padding:20px 30px;
background:#f8fafc;
border-top:1px solid #edf1f5;
text-align:center;
color:#9ca3af;
font-size:12px;
">
© ${new Date().getFullYear()} HealthCom. All rights reserved.
</div>

</div>

</div>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "HealthCom - Appointment Cancelled",
    text,
    html,
  });
}

// =========================================================
// PATIENT APPOINTMENT ACCEPTED EMAIL
// =========================================================

async function sendPatientAppointmentAcceptedEmail({
  email,
  firstName,
  doctorName,
  specialty,
  appointmentDate,
  appointmentTime,
}) {
  const name = safeValue(firstName, "Patient");
  const doctor = safeValue(doctorName, "Doctor");
  const spec = safeValue(specialty, "N/A");
  const date = safeValue(appointmentDate, "N/A");
  const time = safeValue(appointmentTime, "N/A");

  const text = `Hello ${firstName || "Patient"},

Good news! Your appointment request has been accepted by the doctor.

Doctor: ${doctorName}
Specialization: ${specialty}
Date: ${appointmentDate}
Time: ${appointmentTime}

Please log in to your HealthCom account to view your appointment details.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Appointment Accepted</title>
</head>

<body style="
margin:0;
padding:0;
background:#f3f7fb;
font-family:Arial,Helvetica,sans-serif;
color:#1f2937;
">

<div style="padding:32px 14px;">

<div style="
max-width:620px;
margin:auto;
background:#ffffff;
border:1px solid #dbe7df;
border-radius:18px;
overflow:hidden;
">

<div style="
background:#047857;
padding:30px;
color:#ffffff;
">

<div style="
font-size:13px;
letter-spacing:1.5px;
text-transform:uppercase;
font-weight:700;
">
HealthCom
</div>

<h1 style="
margin:8px 0 0;
font-size:26px;
">
Appointment Accepted
</h1>

</div>

<div style="padding:30px;">

<div style="
display:inline-block;
padding:9px 14px;
background:#ecfdf5;
color:#047857;
border:1px solid #a7f3d0;
border-radius:999px;
font-size:13px;
font-weight:700;
">
✓ Confirmed
</div>

<p style="
margin:24px 0 10px;
font-size:16px;
">
Hello ${name},
</p>

<p style="
color:#4b5563;
font-size:15px;
line-height:1.7;
">
Great news! Your appointment request has been
accepted by the doctor. Your appointment is now confirmed.
</p>

<div style="
margin:24px 0;
padding:22px;
background:#f0fdf4;
border:1px solid #bbf7d0;
border-radius:14px;
">

<h3 style="
margin:0 0 16px;
color:#166534;
">
Confirmed Appointment
</h3>

<p><strong>Doctor:</strong> ${doctor}</p>
<p><strong>Specialization:</strong> ${spec}</p>
<p><strong>Date:</strong> ${date}</p>
<p><strong>Time:</strong> ${time}</p>

</div>

<div style="
padding:15px 17px;
background:#eff6ff;
border:1px solid #bfdbfe;
border-radius:12px;
color:#1e40af;
font-size:14px;
line-height:1.6;
">
Please log in to your HealthCom account to view
the complete appointment details and manage your consultation.
</div>

<p style="
margin:25px 0 0;
color:#6b7280;
font-size:13px;
">
We look forward to helping you stay healthy.
<br><br>
<strong style="color:#0878d1;">
HealthCom Team
</strong>
</p>

</div>

<div style="
padding:20px 30px;
background:#f8fafc;
border-top:1px solid #edf1f5;
text-align:center;
color:#9ca3af;
font-size:12px;
">
© ${new Date().getFullYear()} HealthCom. All rights reserved.
</div>

</div>

</div>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "HealthCom - Appointment Accepted",
    text,
    html,
  });
}

// =========================================================
// PATIENT APPOINTMENT REJECTED EMAIL
// =========================================================

async function sendPatientAppointmentRejectedEmail({
  email,
  firstName,
  doctorName,
  specialty,
  appointmentDate,
  appointmentTime,
}) {
  const name = safeValue(firstName, "Patient");
  const doctor = safeValue(doctorName, "Doctor");
  const spec = safeValue(specialty, "N/A");
  const date = safeValue(appointmentDate, "N/A");
  const time = safeValue(appointmentTime, "N/A");

  const text = `Hello ${firstName || "Patient"},

Unfortunately, your appointment request has been rejected by the doctor.

Doctor: ${doctorName}
Specialization: ${specialty}
Date: ${appointmentDate}
Time: ${appointmentTime}

You can search for another available doctor from your HealthCom account.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Appointment Request Rejected</title>
</head>

<body style="
margin:0;
padding:0;
background:#f3f7fb;
font-family:Arial,Helvetica,sans-serif;
color:#1f2937;
">

<div style="padding:32px 14px;">

<div style="
max-width:620px;
margin:auto;
background:#ffffff;
border:1px solid #eadede;
border-radius:18px;
overflow:hidden;
">

<div style="
background:#dc2626;
padding:30px;
color:#ffffff;
">

<div style="
font-size:13px;
letter-spacing:1.5px;
text-transform:uppercase;
font-weight:700;
">
HealthCom
</div>

<h1 style="
margin:8px 0 0;
font-size:26px;
">
Appointment Request Rejected
</h1>

</div>

<div style="padding:30px;">

<div style="
display:inline-block;
padding:9px 14px;
background:#fef2f2;
color:#b91c1c;
border:1px solid #fecaca;
border-radius:999px;
font-size:13px;
font-weight:700;
">
✕ Request Rejected
</div>

<p style="
margin:24px 0 10px;
font-size:16px;
">
Hello ${name},
</p>

<p style="
color:#4b5563;
font-size:15px;
line-height:1.7;
">
Unfortunately, your appointment request could not
be accepted by the doctor. The details of the request
are provided below.
</p>

<div style="
margin:24px 0;
padding:22px;
background:#fffafa;
border:1px solid #fee2e2;
border-radius:14px;
">

<h3 style="
margin:0 0 16px;
color:#991b1b;
">
Request Details
</h3>

<p><strong>Doctor:</strong> ${doctor}</p>
<p><strong>Specialization:</strong> ${spec}</p>
<p><strong>Date:</strong> ${date}</p>
<p><strong>Time:</strong> ${time}</p>

</div>

<div style="
padding:15px 17px;
background:#eff6ff;
border:1px solid #bfdbfe;
border-radius:12px;
color:#1e40af;
font-size:14px;
line-height:1.6;
">
Don't worry. You can search for another available
doctor and submit a new appointment request from
your HealthCom account.
</div>

<p style="
margin:25px 0 0;
color:#6b7280;
font-size:13px;
">
Regards,<br>
<strong style="color:#0878d1;">
HealthCom Team
</strong>
</p>

</div>

<div style="
padding:20px 30px;
background:#f8fafc;
border-top:1px solid #edf1f5;
text-align:center;
color:#9ca3af;
font-size:12px;
">
© ${new Date().getFullYear()} HealthCom. All rights reserved.
</div>

</div>

</div>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "HealthCom - Appointment Request Rejected",
    text,
    html,
  });
}

// =========================================================
// SUBSCRIPTION PAYMENT SUCCESS EMAIL
// =========================================================

async function sendSubscriptionSuccessEmail({
  email,
  firstName,
  planName,
  amount,
  transactionId,
  endDate,
}) {
  const name = safeValue(firstName, "Doctor");
  const plan = safeValue(planName, "Subscription Plan");
  const paidAmount = safeValue(amount, "0");
  const transaction = safeValue(transactionId, "N/A");
  const validUntil = safeValue(formatDate(endDate), "N/A");

  const text = `Hello Dr. ${firstName || "Doctor"},

Your HealthCom subscription payment has been successfully processed.

Subscription Plan: ${planName}
Amount Paid: ₹${amount}
Transaction ID: ${transactionId}
Valid Until: ${formatDate(endDate)}

Your plan is now active and ready to use.

Thank you for choosing HealthCom.`;

  const html = `
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1.0"
>

<title>HealthCom Subscription Activated</title>

</head>

<body style="
margin:0;
padding:0;
background:#f4f7fb;
font-family:Arial,Helvetica,sans-serif;
color:#172033;
">

<div style="
width:100%;
padding:45px 15px;
">

<div style="
width:100%;
max-width:650px;
margin:auto;
background:#ffffff;
border:1px solid #e8edf4;
border-radius:20px;
overflow:hidden;
">

<div style="
padding:28px 38px;
border-bottom:1px solid #edf1f6;
">

<div style="
font-size:25px;
font-weight:800;
color:#10233f;
">
Health<span style="color:#2563eb;">Com</span>
</div>

</div>

<div style="padding:42px 38px;">

<div style="
width:58px;
height:58px;
line-height:58px;
text-align:center;
border-radius:50%;
background:#ecfdf3;
color:#16a34a;
font-size:28px;
font-weight:bold;
">
✓
</div>

<h1 style="
margin:24px 0 10px;
font-size:30px;
color:#111827;
">
Subscription Activated
</h1>

<p style="
margin:0;
font-size:15px;
line-height:1.8;
color:#667085;
">
Hello Dr. ${name},
<br><br>

Your HealthCom subscription payment has been
successfully processed. Your plan is now active
and ready to use.
</p>

<div style="
display:inline-block;
margin-top:20px;
padding:8px 14px;
border-radius:30px;
background:#ecfdf3;
color:#15803d;
font-size:11px;
font-weight:800;
">
PAYMENT SUCCESSFUL
</div>

<div style="
margin-top:32px;
border:1px solid #e6eaf0;
border-radius:14px;
overflow:hidden;
">

<div style="
padding:17px 20px;
background:#f8fafc;
border-bottom:1px solid #e6eaf0;
font-size:14px;
font-weight:700;
">
Subscription Summary
</div>

<div style="
padding:17px 20px;
border-bottom:1px solid #eef1f5;
">
<span style="color:#667085;">
Subscription Plan
</span>

<strong style="float:right;">
${plan}
</strong>
</div>

<div style="
padding:17px 20px;
border-bottom:1px solid #eef1f5;
">
<span style="color:#667085;">
Amount Paid
</span>

<strong style="
float:right;
color:#2563eb;
font-size:17px;
">
₹${paidAmount}
</strong>
</div>

<div style="
padding:17px 20px;
border-bottom:1px solid #eef1f5;
">
<span style="color:#667085;">
Transaction ID
</span>

<strong style="
float:right;
word-break:break-word;
">
${transaction}
</strong>
</div>

<div style="
padding:17px 20px;
">
<span style="color:#667085;">
Valid Until
</span>

<strong style="float:right;">
${validUntil}
</strong>
</div>

</div>

<div style="
margin-top:25px;
padding:18px 20px;
border-radius:10px;
background:#f8fafc;
border:1px solid #edf1f6;
">

<strong style="font-size:13px;">
Your subscription is active
</strong>

<p style="
margin:7px 0 0;
font-size:13px;
line-height:1.7;
color:#667085;
">
You can continue using HealthCom's healthcare
tools and services according to your selected plan.
</p>

</div>

<p style="
margin:26px 0 0;
font-size:13px;
line-height:1.7;
color:#667085;
">
Please keep this email for your records.
If you need help regarding your subscription
or payment, please contact the HealthCom support team.
</p>

</div>

<div style="
padding:28px 38px;
text-align:center;
background:#f8fafc;
border-top:1px solid #edf1f6;
">

<div style="
margin-bottom:7px;
font-size:14px;
font-weight:700;
">
HealthCom
</div>

<p style="
margin:0;
font-size:12px;
line-height:1.7;
color:#98a2b3;
">
Thank you for choosing HealthCom.
<br>
Better healthcare, connected.
</p>

</div>

</div>

</div>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "HealthCom Subscription Activated",
    text,
    html,
  });
}

// =========================================================
// SUBSCRIPTION PAYMENT FAILED EMAIL
// =========================================================

async function sendSubscriptionFailureEmail({
  email,
  firstName,
  planName,
  transactionId,
}) {
  const name = safeValue(firstName, "Doctor");
  const plan = safeValue(planName, "Subscription Plan");
  const transaction = safeValue(transactionId, "N/A");

  const text = `Hello Dr. ${firstName || "Doctor"},

We couldn't complete your HealthCom subscription payment.

Subscription Plan: ${planName}
Transaction ID: ${transactionId}
Payment Status: Failed

Your selected plan has not been activated from this transaction.

Please try the payment again using your preferred payment method.`;

  const html = `
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1.0"
>

<title>HealthCom Payment Failed</title>

</head>

<body style="
margin:0;
padding:0;
background:#f4f7fb;
font-family:Arial,Helvetica,sans-serif;
color:#172033;
">

<div style="
width:100%;
padding:45px 15px;
">

<div style="
width:100%;
max-width:650px;
margin:auto;
background:#ffffff;
border:1px solid #e8edf4;
border-radius:20px;
overflow:hidden;
">

<div style="
padding:28px 38px;
border-bottom:1px solid #edf1f6;
">

<div style="
font-size:25px;
font-weight:800;
color:#10233f;
">
Health<span style="color:#2563eb;">Com</span>
</div>

</div>

<div style="padding:42px 38px;">

<div style="
width:58px;
height:58px;
line-height:58px;
text-align:center;
border-radius:50%;
background:#fff1f2;
color:#dc2626;
font-size:28px;
font-weight:bold;
">
!
</div>

<h1 style="
margin:24px 0 10px;
font-size:30px;
color:#111827;
">
Payment Unsuccessful
</h1>

<p style="
margin:0;
font-size:15px;
line-height:1.8;
color:#667085;
">
Hello Dr. ${name},
<br><br>

We couldn't complete your HealthCom subscription
payment. Your selected plan has not been activated
from this transaction.
</p>

<div style="
display:inline-block;
margin-top:20px;
padding:8px 14px;
border-radius:30px;
background:#fff1f2;
color:#be123c;
font-size:11px;
font-weight:800;
">
PAYMENT FAILED
</div>

<div style="
margin-top:32px;
border:1px solid #e6eaf0;
border-radius:14px;
overflow:hidden;
">

<div style="
padding:17px 20px;
background:#f8fafc;
border-bottom:1px solid #e6eaf0;
font-size:14px;
font-weight:700;
">
Payment Summary
</div>

<div style="
padding:17px 20px;
border-bottom:1px solid #eef1f5;
">
<span style="color:#667085;">
Subscription Plan
</span>

<strong style="float:right;">
${plan}
</strong>
</div>

<div style="
padding:17px 20px;
border-bottom:1px solid #eef1f5;
">
<span style="color:#667085;">
Transaction ID
</span>

<strong style="
float:right;
word-break:break-word;
">
${transaction}
</strong>
</div>

<div style="
padding:17px 20px;
">
<span style="color:#667085;">
Payment Status
</span>

<strong style="
float:right;
color:#dc2626;
">
Failed
</strong>
</div>

</div>

<div style="
margin-top:25px;
padding:19px 20px;
border-radius:10px;
background:#fff8f8;
border:1px solid #fee2e2;
">

<strong style="
font-size:13px;
color:#991b1b;
">
Important payment information
</strong>

<p style="
margin:7px 0 0;
font-size:13px;
line-height:1.7;
color:#667085;
">
If your bank or payment provider has temporarily
deducted the amount, please allow some time for
the transaction to be reversed according to your
payment provider's processing time.
</p>

</div>

<div style="
margin-top:20px;
padding:19px 20px;
border-radius:10px;
background:#f8fafc;
border:1px solid #edf1f6;
">

<strong style="
font-size:13px;
color:#344054;
">
What should you do?
</strong>

<p style="
margin:7px 0 0;
font-size:13px;
line-height:1.7;
color:#667085;
">
Please try the payment again using your preferred
payment method. If the problem continues, verify
your payment details or contact HealthCom support.
</p>

</div>

<p style="
margin:26px 0 0;
font-size:13px;
line-height:1.7;
color:#667085;
">
Please keep your transaction ID for reference.
It can help our support team quickly locate
your payment attempt.
</p>

</div>

<div style="
padding:28px 38px;
text-align:center;
background:#f8fafc;
border-top:1px solid #edf1f6;
">

<div style="
margin-bottom:7px;
font-size:14px;
font-weight:700;
">
HealthCom
</div>

<p style="
margin:0;
font-size:12px;
line-height:1.7;
color:#98a2b3;
">
Need help with your payment?
<br>
The HealthCom team is here to assist you.
</p>

</div>

</div>

</div>

</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "HealthCom Payment Failed",
    text,
    html,
  });
}

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  sendVerificationOtp,
  sendLoginOtp,
  sendPasswordResetOtp,

  sendPatientAppointmentEmail,
  sendDoctorAppointmentEmail,

  sendPatientAppointmentCancellationEmail,

  sendPatientAppointmentAcceptedEmail,
  sendPatientAppointmentRejectedEmail,

  sendSubscriptionSuccessEmail,
  sendSubscriptionFailureEmail,
};
