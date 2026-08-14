const nodemailer = require("nodemailer");

// =========================================================
// ENVIRONMENT CONFIGURATION
// =========================================================

const BREVO_SMTP_USER = process.env.BREVO_SMTP_USER;
const BREVO_SMTP_KEY = process.env.BREVO_SMTP_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

// =========================================================
// VALIDATE EMAIL CONFIGURATION
// =========================================================

function validateEmailConfig() {
  const missing = [];

  if (!BREVO_SMTP_USER) {
    missing.push("BREVO_SMTP_USER");
  }

  if (!BREVO_SMTP_KEY) {
    missing.push("BREVO_SMTP_KEY");
  }

  if (!EMAIL_FROM) {
    missing.push("EMAIL_FROM");
  }

  if (missing.length > 0) {
    console.error("==============================================");
    console.error("❌ BREVO EMAIL CONFIGURATION ERROR");
    console.error("Missing environment variables:");
    console.error(missing.join(", "));
    console.error("==============================================");

    return false;
  }

  return true;
}

const emailConfigValid = validateEmailConfig();

// =========================================================
// BREVO SMTP TRANSPORTER
// =========================================================

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,

  auth: {
    user: BREVO_SMTP_USER,
    pass: BREVO_SMTP_KEY,
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,

  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

// =========================================================
// VERIFY BREVO SMTP CONNECTION
// =========================================================

if (emailConfigValid) {
  transporter.verify((error, success) => {
    if (error) {
      console.error("==============================================");
      console.error("❌ BREVO SMTP CONNECTION FAILED");
      console.error(error.message || error);
      console.error("==============================================");
      return;
    }

    console.log("==============================================");
    console.log("✅ BREVO SMTP CONNECTED SUCCESSFULLY");
    console.log(`📧 SMTP User: ${BREVO_SMTP_USER}`);
    console.log(`📨 From Email: ${EMAIL_FROM}`);
    console.log("==============================================");
  });
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

function safeValue(value, fallback = "Not provided") {
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
    return "Not provided";
  }

  try {
    return new Date(date).toLocaleDateString("en-IN");
  } catch (error) {
    return String(date);
  }
}

// =========================================================
// COMMON MAIL SENDER
// =========================================================

async function sendEmail({
  to,
  subject,
  text,
  html,
}) {
  if (!emailConfigValid) {
    throw new Error(
      "Email service is not configured. Check BREVO_SMTP_USER, BREVO_SMTP_KEY and EMAIL_FROM."
    );
  }

  if (!to) {
    throw new Error("Recipient email address is required.");
  }

  if (!subject) {
    throw new Error("Email subject is required.");
  }

  try {
    const info = await transporter.sendMail({
      from: `"HealthCom" <${EMAIL_FROM}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("==============================================");
    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log(`📧 To: ${to}`);
    console.log(`📌 Subject: ${subject}`);
    console.log(`🆔 Message ID: ${info.messageId}`);
    console.log("==============================================");

    return info;
  } catch (error) {
    console.error("==============================================");
    console.error("❌ EMAIL SENDING FAILED");
    console.error(`📧 To: ${to}`);
    console.error(`📌 Subject: ${subject}`);
    console.error(`❌ Error: ${error.message}`);
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

  return sendEmail({
    to: email,

    subject: "Verify your HealthCom account",

    text: `Hello ${firstName || "User"},

Your HealthCom verification OTP is: ${otp}

This OTP expires in 5 minutes.

If you did not create this account, please ignore this email.`,

    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Verify HealthCom Account</title>
</head>

<body style="
margin:0;
padding:0;
background:#f3f7fb;
font-family:Arial,Helvetica,sans-serif;
color:#1f2937;
">

<div style="
max-width:600px;
margin:40px auto;
background:#ffffff;
border:1px solid #e5e7eb;
border-radius:16px;
overflow:hidden;
">

<div style="
background:#0878d1;
padding:28px;
color:#ffffff;
">

<h1 style="margin:0;font-size:25px;">
HealthCom
</h1>

<p style="
margin:8px 0 0;
font-size:14px;
opacity:.9;
">
Email Verification
</p>

</div>

<div style="padding:32px;">

<p style="font-size:16px;">
Hello ${name},
</p>

<p style="
color:#4b5563;
line-height:1.7;
">
Thank you for creating your HealthCom account.
Please use the OTP below to verify your email address.
</p>

<div style="
margin:28px 0;
padding:22px;
background:#f0f7ff;
border:1px solid #dbeafe;
border-radius:12px;
text-align:center;
">

<div style="
font-size:12px;
color:#64748b;
font-weight:bold;
text-transform:uppercase;
letter-spacing:1px;
">
Verification OTP
</div>

<div style="
margin-top:12px;
font-size:32px;
font-weight:bold;
letter-spacing:8px;
color:#0878d1;
">
${safeOtp}
</div>

</div>

<p style="
font-size:14px;
color:#64748b;
line-height:1.6;
">
This OTP will expire in <strong>5 minutes</strong>.
</p>

<p style="
font-size:13px;
color:#94a3b8;
line-height:1.6;
">
If you did not create this account, please ignore this email.
</p>

</div>

<div style="
padding:20px;
background:#f8fafc;
border-top:1px solid #edf1f5;
text-align:center;
font-size:12px;
color:#94a3b8;
">

© ${new Date().getFullYear()} HealthCom. All rights reserved.

</div>

</div>

</body>
</html>
`,
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

  return sendEmail({
    to: email,

    subject: "HealthCom Login OTP",

    text: `Hello ${firstName || "User"},

Your HealthCom login OTP is: ${otp}

This OTP expires in 5 minutes.

If you did not request this login, please ignore this email.`,

    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>HealthCom Login OTP</title>
</head>

<body style="
margin:0;
padding:0;
background:#f3f7fb;
font-family:Arial,Helvetica,sans-serif;
">

<div style="
max-width:600px;
margin:40px auto;
background:#ffffff;
border:1px solid #e5e7eb;
border-radius:16px;
overflow:hidden;
">

<div style="
background:#0878d1;
padding:28px;
color:#ffffff;
">

<h1 style="margin:0;">
HealthCom
</h1>

<p style="margin:8px 0 0;">
Login Verification
</p>

</div>

<div style="padding:32px;">

<p>Hello ${name},</p>

<p style="
color:#4b5563;
line-height:1.7;
">
Someone is attempting to log in to your HealthCom account.
Use the OTP below to continue.
</p>

<div style="
margin:28px 0;
padding:22px;
background:#f0f7ff;
border:1px solid #dbeafe;
border-radius:12px;
text-align:center;
">

<div style="
font-size:12px;
color:#64748b;
font-weight:bold;
">
LOGIN OTP
</div>

<div style="
margin-top:12px;
font-size:32px;
font-weight:bold;
letter-spacing:8px;
color:#0878d1;
">
${safeOtp}
</div>

</div>

<p style="
font-size:14px;
color:#64748b;
">
This OTP expires in <strong>5 minutes</strong>.
</p>

<p style="
font-size:13px;
color:#94a3b8;
">
If you did not request this login, please ignore this email.
</p>

</div>

<div style="
padding:20px;
background:#f8fafc;
text-align:center;
font-size:12px;
color:#94a3b8;
">

© ${new Date().getFullYear()} HealthCom

</div>

</div>

</body>
</html>
`,
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

  return sendEmail({
    to: email,

    subject: "HealthCom Password Reset OTP",

    text: `Hello ${firstName || "User"},

Your HealthCom password reset OTP is: ${otp}

This OTP expires in 5 minutes.

If you did not request a password reset, please ignore this email.`,

    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>HealthCom Password Reset</title>
</head>

<body style="
margin:0;
padding:0;
background:#f3f7fb;
font-family:Arial,Helvetica,sans-serif;
">

<div style="
max-width:600px;
margin:40px auto;
background:#ffffff;
border:1px solid #e5e7eb;
border-radius:16px;
overflow:hidden;
">

<div style="
background:#0878d1;
padding:28px;
color:#ffffff;
">

<h1 style="margin:0;">
HealthCom
</h1>

<p style="margin:8px 0 0;">
Password Reset
</p>

</div>

<div style="padding:32px;">

<p>Hello ${name},</p>

<p style="
color:#4b5563;
line-height:1.7;
">
We received a request to reset your HealthCom account password.
Use the OTP below to continue.
</p>

<div style="
margin:28px 0;
padding:22px;
background:#f0f7ff;
border:1px solid #dbeafe;
border-radius:12px;
text-align:center;
">

<div style="
font-size:12px;
color:#64748b;
font-weight:bold;
">
PASSWORD RESET OTP
</div>

<div style="
margin-top:12px;
font-size:32px;
font-weight:bold;
letter-spacing:8px;
color:#0878d1;
">
${safeOtp}
</div>

</div>

<p style="
font-size:14px;
color:#64748b;
">
This OTP expires in <strong>5 minutes</strong>.
</p>

<p style="
font-size:13px;
color:#94a3b8;
">
If you did not request a password reset, please ignore this email.
</p>

</div>

<div style="
padding:20px;
background:#f8fafc;
text-align:center;
font-size:12px;
color:#94a3b8;
">

© ${new Date().getFullYear()} HealthCom

</div>

</div>

</body>
</html>
`,
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
  const doctor = safeValue(doctorName);
  const specialization = safeValue(specialty);
  const date = safeValue(appointmentDate);
  const time = safeValue(appointmentTime);

  return sendEmail({
    to: email,

    subject: "HealthCom - Appointment Request Received",

    text: `Hello ${firstName || "Patient"},

Your appointment request with ${doctorName} has been submitted successfully.

Doctor: ${doctorName}
Specialization: ${specialty}
Date: ${appointmentDate}
Time: ${appointmentTime}

Your request is currently pending doctor approval.

You will receive another email when the doctor accepts or rejects the request.

Thank you for choosing HealthCom.`,

    html: `
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

<div style="padding:32px 14px;">

<div style="
max-width:620px;
margin:auto;
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

<p style="margin:24px 0 10px;font-size:16px;">
Hello ${name},
</p>

<p style="
margin:0;
color:#4b5563;
font-size:15px;
line-height:1.7;
">
Your appointment request has been sent successfully.
The doctor will review your request and you will receive
another notification once a decision is made.
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
letter-spacing:.6px;
margin-bottom:16px;
">
Appointment Details
</div>

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="padding:10px 0;color:#6b7280;">
Doctor
</td>

<td style="
padding:10px 0;
text-align:right;
font-weight:bold;
">
${doctor}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Specialization
</td>

<td style="
padding:10px 0;
text-align:right;
font-weight:bold;
">
${specialization}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Date
</td>

<td style="
padding:10px 0;
text-align:right;
font-weight:bold;
">
${date}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Time
</td>

<td style="
padding:10px 0;
text-align:right;
font-weight:bold;
">
${time}
</td>
</tr>

</table>

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

<br><br>

Your request is waiting for doctor approval.
Please check your HealthCom account for the latest appointment status.

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
`,
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
  const patient = safeValue(patientName);
  const pEmail = safeValue(patientEmail);
  const phone = safeValue(patientPhone);
  const doctor = safeValue(doctorName);
  const date = safeValue(appointmentDate);
  const time = safeValue(appointmentTime);

  return sendEmail({
    to: email,

    subject: "HealthCom - New Appointment Request",

    text: `Hello ${firstName || "Doctor"},

You have received a new appointment request through HealthCom.

Patient: ${patientName}
Patient Email: ${patientEmail}
Patient Phone: ${patientPhone || "Not provided"}

Doctor: ${doctorName}
Date: ${appointmentDate}
Time: ${appointmentTime}

Please open your HealthCom dashboard to review and accept or reject this appointment request.`,

    html: `
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

<div style="padding:32px 14px;">

<div style="
max-width:620px;
margin:auto;
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

<p style="margin:24px 0 10px;font-size:16px;">
Hello ${name},
</p>

<p style="
margin:0;
color:#4b5563;
font-size:15px;
line-height:1.7;
">
A patient has submitted a new appointment request.
Please review the details below and choose the appropriate
action from your HealthCom dashboard.
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

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="padding:10px 0;color:#6b7280;">
Patient
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${patient}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Email
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;word-break:break-word;">
${pEmail}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Phone
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${phone}
</td>
</tr>

</table>

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

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="padding:10px 0;color:#6b7280;">
Doctor
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${doctor}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Date
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${date}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Time
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${time}
</td>
</tr>

</table>

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

<br><br>

Please review this request in your HealthCom dashboard
and accept or reject it.

</div>

</div>

<div style="
padding:20px 30px;
background:#f8fafc;
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
`,
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
  const doctor = safeValue(doctorName);
  const specialization = safeValue(specialty);
  const date = safeValue(appointmentDate);
  const time = safeValue(appointmentTime);

  return sendEmail({
    to: email,

    subject: "HealthCom - Appointment Cancelled",

    text: `Hello ${firstName || "Patient"},

Your appointment with ${doctorName} has been cancelled.

Doctor: ${doctorName}
Specialization: ${specialty}
Date: ${appointmentDate}
Time: ${appointmentTime}

You can book another appointment through your HealthCom dashboard.`,

    html: `
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
font-weight:bold;
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
font-weight:bold;
">
● Cancelled
</div>

<p style="margin:24px 0 10px;font-size:16px;">
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

<div style="
font-size:13px;
color:#991b1b;
font-weight:bold;
text-transform:uppercase;
margin-bottom:16px;
">
Cancelled Appointment
</div>

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="padding:10px 0;color:#6b7280;">
Doctor
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${doctor}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Specialization
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${specialization}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Date
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${date}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Time
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${time}
</td>
</tr>

</table>

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
margin-top:25px;
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
`,
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
  const doctor = safeValue(doctorName);
  const specialization = safeValue(specialty);
  const date = safeValue(appointmentDate);
  const time = safeValue(appointmentTime);

  return sendEmail({
    to: email,

    subject: "HealthCom - Appointment Accepted",

    text: `Hello ${firstName || "Patient"},

Good news! Your appointment request has been accepted by the doctor.

Doctor: ${doctorName}
Specialization: ${specialty}
Date: ${appointmentDate}
Time: ${appointmentTime}

Please log in to your HealthCom account to view your appointment details.`,

    html: `
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
background:#16a34a;
padding:30px;
color:#ffffff;
">

<div style="
font-size:13px;
letter-spacing:1.5px;
text-transform:uppercase;
font-weight:bold;
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
font-weight:bold;
">
✓ Confirmed
</div>

<p style="margin:24px 0 10px;font-size:16px;">
Hello ${name},
</p>

<p style="
color:#4b5563;
font-size:15px;
line-height:1.7;
">
Great news! Your appointment request has been accepted
by the doctor. Your appointment is now confirmed.
</p>

<div style="
margin:24px 0;
padding:22px;
background:#f0fdf4;
border:1px solid #bbf7d0;
border-radius:14px;
">

<div style="
font-size:13px;
color:#166534;
font-weight:bold;
text-transform:uppercase;
margin-bottom:16px;
">
Confirmed Appointment
</div>

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="padding:10px 0;color:#6b7280;">
Doctor
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${doctor}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Specialization
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${specialization}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Date
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${date}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Time
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${time}
</td>
</tr>

</table>

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
margin-top:25px;
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
`,
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
  const doctor = safeValue(doctorName);
  const specialization = safeValue(specialty);
  const date = safeValue(appointmentDate);
  const time = safeValue(appointmentTime);

  return sendEmail({
    to: email,

    subject: "HealthCom - Appointment Request Rejected",

    text: `Hello ${firstName || "Patient"},

Unfortunately, your appointment request has been rejected by the doctor.

Doctor: ${doctorName}
Specialization: ${specialty}
Date: ${appointmentDate}
Time: ${appointmentTime}

You can search for another available doctor from your HealthCom account.`,

    html: `
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
font-weight:bold;
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
font-weight:bold;
">
✕ Request Rejected
</div>

<p style="margin:24px 0 10px;font-size:16px;">
Hello ${name},
</p>

<p style="
color:#4b5563;
font-size:15px;
line-height:1.7;
">
Unfortunately, your appointment request could not be
accepted by the doctor. The details of the request
are provided below.
</p>

<div style="
margin:24px 0;
padding:22px;
background:#fffafa;
border:1px solid #fee2e2;
border-radius:14px;
">

<div style="
font-size:13px;
color:#991b1b;
font-weight:bold;
text-transform:uppercase;
margin-bottom:16px;
">
Request Details
</div>

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="padding:10px 0;color:#6b7280;">
Doctor
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${doctor}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Specialization
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${specialization}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Date
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${date}
</td>
</tr>

<tr>
<td style="padding:10px 0;color:#6b7280;">
Time
</td>

<td style="padding:10px 0;text-align:right;font-weight:bold;">
${time}
</td>
</tr>

</table>

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
margin-top:25px;
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
`,
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
  const plan = safeValue(planName);
  const price = safeValue(amount);
  const transaction = safeValue(transactionId);
  const validUntil = formatDate(endDate);

  return sendEmail({
    to: email,

    subject: "HealthCom Subscription Activated",

    text: `Hello ${firstName || "Doctor"},

Your HealthCom subscription payment has been successfully processed.

Subscription Plan: ${planName}
Amount Paid: ₹${amount}
Transaction ID: ${transactionId}
Valid Until: ${validUntil}

Your plan is now active and ready to use.

Thank you for choosing HealthCom.`,

    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Subscription Activated</title>
</head>

<body style="
margin:0;
padding:0;
background:#f4f7fb;
font-family:Arial,Helvetica,sans-serif;
color:#172033;
">

<div style="padding:45px 15px;">

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
Hello ${name},
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

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="padding:17px 20px;color:#667085;">
Subscription Plan
</td>

<td style="
padding:17px 20px;
text-align:right;
font-weight:700;
">
${plan}
</td>
</tr>

<tr>
<td style="padding:17px 20px;color:#667085;">
Amount Paid
</td>

<td style="
padding:17px 20px;
text-align:right;
font-weight:700;
color:#2563eb;
font-size:17px;
">
₹${price}
</td>
</tr>

<tr>
<td style="padding:17px 20px;color:#667085;">
Transaction ID
</td>

<td style="
padding:17px 20px;
text-align:right;
font-weight:700;
word-break:break-word;
">
${transaction}
</td>
</tr>

<tr>
<td style="padding:17px 20px;color:#667085;">
Valid Until
</td>

<td style="
padding:17px 20px;
text-align:right;
font-weight:700;
">
${validUntil}
</td>
</tr>

</table>

</div>

<div style="
margin-top:25px;
padding:18px 20px;
border-radius:10px;
background:#f8fafc;
border:1px solid #edf1f6;
">

<p style="
margin:0 0 7px;
font-size:13px;
font-weight:700;
color:#344054;
">
Your subscription is active
</p>

<p style="
margin:0;
font-size:13px;
line-height:1.7;
color:#667085;
">
You can continue using HealthCom's healthcare
tools and services according to your selected
subscription plan.
</p>

</div>

<p style="
margin-top:26px;
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
color:#344054;
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
`,
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
  const plan = safeValue(planName);
  const transaction = safeValue(transactionId);

  return sendEmail({
    to: email,

    subject: "HealthCom Payment Failed",

    text: `Hello ${firstName || "Doctor"},

We couldn't complete your HealthCom subscription payment.

Subscription Plan: ${planName}
Transaction ID: ${transactionId}
Payment Status: Failed

Please try the payment again using your preferred payment method.

If the amount was deducted, please allow time for the payment provider to reverse the transaction.`,

    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Payment Failed</title>
</head>

<body style="
margin:0;
padding:0;
background:#f4f7fb;
font-family:Arial,Helvetica,sans-serif;
color:#172033;
">

<div style="padding:45px 15px;">

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
Hello ${name},
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

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="padding:17px 20px;color:#667085;">
Subscription Plan
</td>

<td style="
padding:17px 20px;
text-align:right;
font-weight:700;
">
${plan}
</td>
</tr>

<tr>
<td style="padding:17px 20px;color:#667085;">
Transaction ID
</td>

<td style="
padding:17px 20px;
text-align:right;
font-weight:700;
word-break:break-word;
">
${transaction}
</td>
</tr>

<tr>
<td style="padding:17px 20px;color:#667085;">
Payment Status
</td>

<td style="
padding:17px 20px;
text-align:right;
font-weight:700;
color:#dc2626;
">
Failed
</td>
</tr>

</table>

</div>

<div style="
margin-top:25px;
padding:19px 20px;
border-radius:10px;
background:#fff8f8;
border:1px solid #fee2e2;
">

<p style="
margin:0 0 7px;
font-size:13px;
font-weight:700;
color:#991b1b;
">
Important payment information
</p>

<p style="
margin:0;
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

<p style="
margin:0 0 7px;
font-size:13px;
font-weight:700;
color:#344054;
">
What should you do?
</p>

<p style="
margin:0;
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
margin-top:26px;
font-size:13px;
line-height:1.7;
color:#667085;
">
Please keep your transaction ID for reference.
It can help our support team quickly locate your
payment attempt.
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
color:#344054;
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
`,
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
