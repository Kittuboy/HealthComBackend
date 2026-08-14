const nodemailer = require("nodemailer");



// =========================================================
// BREVO SMTP TRANSPORTER
// =========================================================

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,

  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
});

// =========================================================
// VERIFY EMAIL CONFIGURATION
// =========================================================

transporter.verify((error, success) => {
  if (error) {
    console.error("========== BREVO SMTP ERROR ==========");
    console.error(error);
    console.error("======================================");
    return;
  }

  console.log("========== BREVO SMTP CONNECTED ==========");
  console.log(success);
  console.log("==========================================");
});

// =========================================================
// VERIFICATION OTP
// =========================================================

async function sendVerificationOtp({
  email,
  firstName,
  otp,
}) {
  const mailOptions = {
    from: `"HealthCom" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Verify your HealthCom account",

    text: `Hello ${firstName},

Your HealthCom verification OTP is: ${otp}

This OTP expires in 5 minutes.

If you did not create this account, please ignore this email.`,

    html: `
      <main
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 32px;
          color: #333;
        "
      >
        <h1 style="color: #0878d1;">
          HealthCom
        </h1>

        <p>
          Hello ${firstName},
        </p>

        <p>
          Your email verification OTP is:
        </p>

        <h2
          style="
            color: #0878d1;
            letter-spacing: 8px;
          "
        >
          ${otp}
        </h2>

        <p>
          This OTP expires in 5 minutes.
        </p>

        <p>
          If you did not create this account,
          please ignore this email.
        </p>
      </main>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// =========================================================
// LOGIN OTP
// =========================================================

async function sendLoginOtp({
  email,
  firstName,
  otp,
}) {
  const mailOptions = {
    from: `"HealthCom" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "HealthCom Login OTP",

    text: `Hello ${firstName},

Your HealthCom login OTP is: ${otp}

This OTP expires in 5 minutes.

If you did not request this login, please ignore this email.`,

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
          color: #333;
        "
      >
        <h2 style="color: #0878d1;">
          HealthCom Login Verification
        </h2>

        <p>
          Hello ${firstName},
        </p>

        <p>
          Your Login OTP is:
        </p>

        <h1
          style="
            letter-spacing: 8px;
            color: #0878d1;
          "
        >
          ${otp}
        </h1>

        <p>
          OTP expires in 5 minutes.
        </p>

        <p>
          If you did not request this login,
          please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// =========================================================
// PASSWORD RESET OTP
// =========================================================

async function sendPasswordResetOtp({
  email,
  firstName,
  otp,
}) {
  const mailOptions = {
    from: `"HealthCom" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "HealthCom Password Reset OTP",

    text: `Hello ${firstName},

Your HealthCom password reset OTP is: ${otp}

This OTP expires in 5 minutes.

If you did not request a password reset, please ignore this email.`,

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
          color: #333;
        "
      >
        <h2 style="color: #0878d1;">
          HealthCom Password Reset
        </h2>

        <p>
          Hello ${firstName},
        </p>

        <p>
          Your password reset OTP is:
        </p>

        <h1
          style="
            letter-spacing: 8px;
            color: #0878d1;
          "
        >
          ${otp}
        </h1>

        <p>
          OTP expires in 5 minutes.
        </p>

        <p>
          If you did not request a password reset,
          please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

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
  const mailOptions = {
    from: `"HealthCom" <${process.env.EMAIL_FROM}>`,
    to: email,

    subject:
      "HealthCom - Appointment Request Received",

    text: `Hello ${firstName},

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

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          Appointment Request Received
        </title>

      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f3f7fb;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        "
      >

        <div
          style="
            width:100%;
            padding:32px 14px;
            box-sizing:border-box;
          "
        >

          <div
            style="
              max-width:620px;
              margin:0 auto;
              background:#ffffff;
              border:1px solid #e5eaf1;
              border-radius:18px;
              overflow:hidden;
              box-shadow:0 8px 30px rgba(15,23,42,0.07);
            "
          >

            <!-- HEADER -->

            <div
              style="
                background:linear-gradient(
                  135deg,
                  #0878d1,
                  #0b5cad
                );
                padding:30px;
                color:#ffffff;
              "
            >

              <div
                style="
                  font-size:13px;
                  letter-spacing:1.5px;
                  text-transform:uppercase;
                  opacity:.85;
                  font-weight:700;
                "
              >
                HealthCom
              </div>

              <h1
                style="
                  margin:8px 0 0;
                  font-size:26px;
                  line-height:1.25;
                "
              >
                Appointment Request Received
              </h1>

            </div>

            <!-- CONTENT -->

            <div style="padding:30px;">

              <div
                style="
                  display:inline-block;
                  padding:9px 14px;
                  background:#fff7ed;
                  color:#c2410c;
                  border:1px solid #fed7aa;
                  border-radius:999px;
                  font-size:13px;
                  font-weight:700;
                "
              >
                ● Request Pending
              </div>

              <p
                style="
                  margin:24px 0 10px;
                  font-size:16px;
                "
              >
                Hello ${firstName || "Patient"},
              </p>

              <p
                style="
                  margin:0;
                  color:#4b5563;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Your appointment request has been
                sent successfully. The doctor will
                review your request and you will
                receive a separate notification once
                a decision is made.
              </p>

              <!-- APPOINTMENT DETAILS -->

              <div
                style="
                  margin:24px 0;
                  padding:22px;
                  background:#f8fbff;
                  border:1px solid #e1edf9;
                  border-radius:14px;
                "
              >

                <div
                  style="
                    font-size:13px;
                    color:#6b7280;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.6px;
                    margin-bottom:16px;
                  "
                >
                  Appointment Details
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #e8eef5;
                  "
                >
                  <span style="color:#6b7280;">
                    Doctor
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${doctorName}
                  </strong>
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #e8eef5;
                  "
                >
                  <span style="color:#6b7280;">
                    Specialization
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${specialty}
                  </strong>
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #e8eef5;
                  "
                >
                  <span style="color:#6b7280;">
                    Date
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${appointmentDate}
                  </strong>
                </div>

                <div
                  style="
                    padding:11px 0;
                  "
                >
                  <span style="color:#6b7280;">
                    Time
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${appointmentTime}
                  </strong>
                </div>

              </div>

              <!-- NEXT STEP -->

              <div
                style="
                  padding:15px 17px;
                  background:#f0fdf4;
                  border:1px solid #bbf7d0;
                  border-radius:12px;
                  color:#166534;
                  font-size:14px;
                  line-height:1.6;
                "
              >

                <strong>
                  What happens next?
                </strong>

                <br />

                Your request is waiting for doctor
                approval. Please check your HealthCom
                account for the latest appointment status.

              </div>

              <p
                style="
                  margin:25px 0 0;
                  color:#6b7280;
                  font-size:13px;
                  line-height:1.6;
                "
              >
                Thank you for choosing
                <strong style="color:#0878d1;">
                  HealthCom
                </strong>.
              </p>

            </div>

            <!-- FOOTER -->

            <div
              style="
                padding:20px 30px;
                background:#f8fafc;
                border-top:1px solid #edf1f5;
                text-align:center;
                color:#9ca3af;
                font-size:12px;
              "
            >
              © ${new Date().getFullYear()}
              HealthCom. All rights reserved.
            </div>

          </div>

        </div>

      </body>

      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
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
  const mailOptions = {
    from: `"HealthCom" <${process.env.EMAIL_FROM}>`,
    to: email,

    subject:
      "HealthCom - New Appointment Request",

    text: `Hello ${firstName},

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

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          New Appointment Request
        </title>

      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f3f7fb;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        "
      >

        <div
          style="
            width:100%;
            padding:32px 14px;
            box-sizing:border-box;
          "
        >

          <div
            style="
              max-width:620px;
              margin:0 auto;
              background:#ffffff;
              border:1px solid #e5eaf1;
              border-radius:18px;
              overflow:hidden;
              box-shadow:0 8px 30px rgba(15,23,42,0.07);
            "
          >

            <!-- HEADER -->

            <div
              style="
                background:linear-gradient(
                  135deg,
                  #0878d1,
                  #0b5cad
                );
                padding:30px;
                color:#ffffff;
              "
            >

              <div
                style="
                  font-size:13px;
                  letter-spacing:1.5px;
                  text-transform:uppercase;
                  opacity:.85;
                  font-weight:700;
                "
              >
                HealthCom
              </div>

              <h1
                style="
                  margin:8px 0 0;
                  font-size:26px;
                  line-height:1.25;
                "
              >
                New Appointment Request
              </h1>

            </div>

            <!-- CONTENT -->

            <div style="padding:30px;">

              <div
                style="
                  display:inline-block;
                  padding:9px 14px;
                  background:#eff6ff;
                  color:#1d4ed8;
                  border:1px solid #bfdbfe;
                  border-radius:999px;
                  font-size:13px;
                  font-weight:700;
                "
              >
                ● Action Required
              </div>

              <p
                style="
                  margin:24px 0 10px;
                  font-size:16px;
                "
              >
                Hello ${firstName || "Doctor"},
              </p>

              <p
                style="
                  margin:0;
                  color:#4b5563;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                A patient has submitted a new
                appointment request. Please review
                the details below and choose the
                appropriate action from your HealthCom
                dashboard.
              </p>

              <!-- PATIENT DETAILS -->

              <div
                style="
                  margin:24px 0;
                  padding:22px;
                  background:#f8fbff;
                  border:1px solid #e1edf9;
                  border-radius:14px;
                "
              >

                <div
                  style="
                    font-size:13px;
                    color:#6b7280;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.6px;
                    margin-bottom:16px;
                  "
                >
                  Patient Details
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #e8eef5;
                  "
                >
                  <span style="color:#6b7280;">
                    Patient
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${patientName}
                  </strong>
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #e8eef5;
                  "
                >
                  <span style="color:#6b7280;">
                    Email
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${patientEmail}
                  </strong>
                </div>

                <div style="padding:11px 0;">

                  <span style="color:#6b7280;">
                    Phone
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${patientPhone || "Not provided"}
                  </strong>

                </div>

              </div>

              <!-- APPOINTMENT DETAILS -->

              <div
                style="
                  padding:22px;
                  background:#f8fafc;
                  border:1px solid #e5e7eb;
                  border-radius:14px;
                "
              >

                <div
                  style="
                    font-size:13px;
                    color:#6b7280;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.6px;
                    margin-bottom:16px;
                  "
                >
                  Appointment Details
                </div>

                <div
                  style="
                    padding:10px 0;
                    border-bottom:1px solid #e5e7eb;
                  "
                >
                  <span style="color:#6b7280;">
                    Doctor
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${doctorName}
                  </strong>
                </div>

                <div
                  style="
                    padding:10px 0;
                    border-bottom:1px solid #e5e7eb;
                  "
                >
                  <span style="color:#6b7280;">
                    Date
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${appointmentDate}
                  </strong>
                </div>

                <div style="padding:10px 0;">

                  <span style="color:#6b7280;">
                    Time
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${appointmentTime}
                  </strong>

                </div>

              </div>

              <!-- ACTION MESSAGE -->

              <div
                style="
                  margin-top:24px;
                  padding:15px 17px;
                  background:#fff7ed;
                  border:1px solid #fed7aa;
                  border-radius:12px;
                  color:#9a3412;
                  font-size:14px;
                  line-height:1.6;
                "
              >

                <strong>
                  Pending your decision.
                </strong>

                <br />

                Please review this request in your
                HealthCom dashboard and accept or
                reject it.

              </div>

            </div>

            <!-- FOOTER -->

            <div
              style="
                padding:20px 30px;
                background:#f8fafc;
                border-top:1px solid #edf1f5;
                text-align:center;
                color:#9ca3af;
                font-size:12px;
              "
            >
              © ${new Date().getFullYear()}
              HealthCom. All rights reserved.
            </div>

          </div>

        </div>

      </body>

      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// =========================================================
// PATIENT APPOINTMENT CANCELLATION EMAIL
// =========================================================

const sendPatientAppointmentCancellationEmail = async ({
  email,
  firstName,
  doctorName,
  specialty,
  appointmentDate,
  appointmentTime,
}) => {
  const mailOptions = {
    from: `"HealthCom" <${process.env.EMAIL_FROM}>`,
    to: email,

    subject:
      "HealthCom - Appointment Cancelled",

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

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          Appointment Cancelled
        </title>

      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f3f7fb;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        "
      >

        <div
          style="
            width:100%;
            padding:32px 14px;
            box-sizing:border-box;
          "
        >

          <div
            style="
              max-width:620px;
              margin:0 auto;
              background:#ffffff;
              border:1px solid #e5e7eb;
              border-radius:18px;
              overflow:hidden;
              box-shadow:0 8px 30px rgba(15,23,42,0.07);
            "
          >

            <!-- HEADER -->

            <div
              style="
                background:linear-gradient(
                  135deg,
                  #b91c1c,
                  #dc2626
                );
                padding:30px;
                color:#ffffff;
              "
            >

              <div
                style="
                  font-size:13px;
                  letter-spacing:1.5px;
                  text-transform:uppercase;
                  opacity:.9;
                  font-weight:700;
                "
              >
                HealthCom
              </div>

              <h1
                style="
                  margin:8px 0 0;
                  font-size:26px;
                  line-height:1.25;
                "
              >
                Appointment Cancelled
              </h1>

            </div>

            <!-- CONTENT -->

            <div style="padding:30px;">

              <div
                style="
                  display:inline-block;
                  padding:9px 14px;
                  background:#fef2f2;
                  color:#b91c1c;
                  border:1px solid #fecaca;
                  border-radius:999px;
                  font-size:13px;
                  font-weight:700;
                "
              >
                ● Cancelled
              </div>

              <p
                style="
                  margin:24px 0 10px;
                  font-size:16px;
                "
              >
                Hello ${firstName || "Patient"},
              </p>

              <p
                style="
                  margin:0;
                  color:#4b5563;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Your appointment has been cancelled
                successfully. The appointment details
                are provided below for your reference.
              </p>

              <!-- DETAILS -->

              <div
                style="
                  margin:24px 0;
                  padding:22px;
                  background:#fffafa;
                  border:1px solid #fee2e2;
                  border-radius:14px;
                "
              >

                <div
                  style="
                    font-size:13px;
                    color:#6b7280;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.6px;
                    margin-bottom:16px;
                  "
                >
                  Cancelled Appointment
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #f1e5e5;
                  "
                >
                  <span style="color:#6b7280;">
                    Doctor
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${doctorName}
                  </strong>
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #f1e5e5;
                  "
                >
                  <span style="color:#6b7280;">
                    Specialization
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${specialty}
                  </strong>
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #f1e5e5;
                  "
                >
                  <span style="color:#6b7280;">
                    Date
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${appointmentDate}
                  </strong>
                </div>

                <div style="padding:11px 0;">

                  <span style="color:#6b7280;">
                    Time
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${appointmentTime}
                  </strong>

                </div>

              </div>

              <!-- INFO -->

              <div
                style="
                  padding:15px 17px;
                  background:#eff6ff;
                  border:1px solid #bfdbfe;
                  border-radius:12px;
                  color:#1e40af;
                  font-size:14px;
                  line-height:1.6;
                "
              >
                Need another consultation?
                You can search for an available doctor
                and book a new appointment from your
                HealthCom account.
              </div>

              <p
                style="
                  margin:25px 0 0;
                  color:#6b7280;
                  font-size:13px;
                "
              >
                Regards,<br />

                <strong style="color:#0878d1;">
                  HealthCom Team
                </strong>
              </p>

            </div>

            <!-- FOOTER -->

            <div
              style="
                padding:20px 30px;
                background:#f8fafc;
                border-top:1px solid #edf1f5;
                text-align:center;
                color:#9ca3af;
                font-size:12px;
              "
            >
              © ${new Date().getFullYear()}
              HealthCom. All rights reserved.
            </div>

          </div>

        </div>

      </body>

      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// =========================================================
// PATIENT APPOINTMENT ACCEPTED EMAIL
// =========================================================

const sendPatientAppointmentAcceptedEmail = async ({
  email,
  firstName,
  doctorName,
  specialty,
  appointmentDate,
  appointmentTime,
}) => {
  const mailOptions = {
    from: `"HealthCom" <${process.env.EMAIL_FROM}>`,
    to: email,

    subject:
      "HealthCom - Appointment Accepted",

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

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          Appointment Accepted
        </title>

      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f3f7fb;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        "
      >

        <div
          style="
            width:100%;
            padding:32px 14px;
            box-sizing:border-box;
          "
        >

          <div
            style="
              max-width:620px;
              margin:0 auto;
              background:#ffffff;
              border:1px solid #dbe7df;
              border-radius:18px;
              overflow:hidden;
              box-shadow:0 8px 30px rgba(15,23,42,0.07);
            "
          >

            <!-- HEADER -->

            <div
              style="
                background:linear-gradient(
                  135deg,
                  #047857,
                  #16a34a
                );
                padding:30px;
                color:#ffffff;
              "
            >

              <div
                style="
                  font-size:13px;
                  letter-spacing:1.5px;
                  text-transform:uppercase;
                  opacity:.9;
                  font-weight:700;
                "
              >
                HealthCom
              </div>

              <h1
                style="
                  margin:8px 0 0;
                  font-size:26px;
                  line-height:1.25;
                "
              >
                Appointment Accepted
              </h1>

            </div>

            <!-- CONTENT -->

            <div style="padding:30px;">

              <div
                style="
                  display:inline-block;
                  padding:9px 14px;
                  background:#ecfdf5;
                  color:#047857;
                  border:1px solid #a7f3d0;
                  border-radius:999px;
                  font-size:13px;
                  font-weight:700;
                "
              >
                ✓ Confirmed
              </div>

              <p
                style="
                  margin:24px 0 10px;
                  font-size:16px;
                "
              >
                Hello ${firstName || "Patient"},
              </p>

              <p
                style="
                  margin:0;
                  color:#4b5563;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Great news! Your appointment request
                has been accepted by the doctor.
                Your appointment is now confirmed.
              </p>

              <!-- CONFIRMED DETAILS -->

              <div
                style="
                  margin:24px 0;
                  padding:22px;
                  background:#f0fdf4;
                  border:1px solid #bbf7d0;
                  border-radius:14px;
                "
              >

                <div
                  style="
                    font-size:13px;
                    color:#166534;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.6px;
                    margin-bottom:16px;
                  "
                >
                  Confirmed Appointment
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #dcfce7;
                  "
                >
                  <span style="color:#6b7280;">
                    Doctor
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${doctorName}
                  </strong>
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #dcfce7;
                  "
                >
                  <span style="color:#6b7280;">
                    Specialization
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${specialty}
                  </strong>
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #dcfce7;
                  "
                >
                  <span style="color:#6b7280;">
                    Date
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${appointmentDate}
                  </strong>
                </div>

                <div style="padding:11px 0;">

                  <span style="color:#6b7280;">
                    Time
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${appointmentTime}
                  </strong>

                </div>

              </div>

              <!-- INFO -->

              <div
                style="
                  padding:15px 17px;
                  background:#eff6ff;
                  border:1px solid #bfdbfe;
                  border-radius:12px;
                  color:#1e40af;
                  font-size:14px;
                  line-height:1.6;
                "
              >
                Please log in to your HealthCom
                account to view the complete
                appointment details and manage
                your consultation.
              </div>

              <p
                style="
                  margin:25px 0 0;
                  color:#6b7280;
                  font-size:13px;
                "
              >
                We look forward to helping you
                stay healthy.

                <br />

                <strong style="color:#0878d1;">
                  HealthCom Team
                </strong>
              </p>

            </div>

            <!-- FOOTER -->

            <div
              style="
                padding:20px 30px;
                background:#f8fafc;
                border-top:1px solid #edf1f5;
                text-align:center;
                color:#9ca3af;
                font-size:12px;
              "
            >
              © ${new Date().getFullYear()}
              HealthCom. All rights reserved.
            </div>

          </div>

        </div>

      </body>

      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// =========================================================
// PATIENT APPOINTMENT REJECTED EMAIL
// =========================================================

const sendPatientAppointmentRejectedEmail = async ({
  email,
  firstName,
  doctorName,
  specialty,
  appointmentDate,
  appointmentTime,
}) => {
  const mailOptions = {
    from: `"HealthCom" <${process.env.EMAIL_FROM}>`,
    to: email,

    subject:
      "HealthCom - Appointment Request Rejected",

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

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          Appointment Request Rejected
        </title>

      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f3f7fb;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        "
      >

        <div
          style="
            width:100%;
            padding:32px 14px;
            box-sizing:border-box;
          "
        >

          <div
            style="
              max-width:620px;
              margin:0 auto;
              background:#ffffff;
              border:1px solid #eadede;
              border-radius:18px;
              overflow:hidden;
              box-shadow:0 8px 30px rgba(15,23,42,0.07);
            "
          >

            <!-- HEADER -->

            <div
              style="
                background:linear-gradient(
                  135deg,
                  #991b1b,
                  #dc2626
                );
                padding:30px;
                color:#ffffff;
              "
            >

              <div
                style="
                  font-size:13px;
                  letter-spacing:1.5px;
                  text-transform:uppercase;
                  opacity:.9;
                  font-weight:700;
                "
              >
                HealthCom
              </div>

              <h1
                style="
                  margin:8px 0 0;
                  font-size:26px;
                  line-height:1.25;
                "
              >
                Appointment Request Rejected
              </h1>

            </div>

            <!-- CONTENT -->

            <div style="padding:30px;">

              <div
                style="
                  display:inline-block;
                  padding:9px 14px;
                  background:#fef2f2;
                  color:#b91c1c;
                  border:1px solid #fecaca;
                  border-radius:999px;
                  font-size:13px;
                  font-weight:700;
                "
              >
                ✕ Request Rejected
              </div>

              <p
                style="
                  margin:24px 0 10px;
                  font-size:16px;
                "
              >
                Hello ${firstName || "Patient"},
              </p>

              <p
                style="
                  margin:0;
                  color:#4b5563;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Unfortunately, your appointment
                request could not be accepted by
                the doctor. The details of the request
                are provided below.
              </p>

              <!-- REQUEST DETAILS -->

              <div
                style="
                  margin:24px 0;
                  padding:22px;
                  background:#fffafa;
                  border:1px solid #fee2e2;
                  border-radius:14px;
                "
              >

                <div
                  style="
                    font-size:13px;
                    color:#991b1b;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.6px;
                    margin-bottom:16px;
                  "
                >
                  Request Details
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #f3e1e1;
                  "
                >
                  <span style="color:#6b7280;">
                    Doctor
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${doctorName}
                  </strong>
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #f3e1e1;
                  "
                >
                  <span style="color:#6b7280;">
                    Specialization
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${specialty}
                  </strong>
                </div>

                <div
                  style="
                    padding:11px 0;
                    border-bottom:1px solid #f3e1e1;
                  "
                >
                  <span style="color:#6b7280;">
                    Date
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${appointmentDate}
                  </strong>
                </div>

                <div style="padding:11px 0;">

                  <span style="color:#6b7280;">
                    Time
                  </span>

                  <strong
                    style="
                      float:right;
                      color:#111827;
                    "
                  >
                    ${appointmentTime}
                  </strong>

                </div>

              </div>

              <!-- ALTERNATIVE -->

              <div
                style="
                  padding:15px 17px;
                  background:#eff6ff;
                  border:1px solid #bfdbfe;
                  border-radius:12px;
                  color:#1e40af;
                  font-size:14px;
                  line-height:1.6;
                "
              >
                Don't worry. You can search for
                another available doctor and submit
                a new appointment request from your
                HealthCom account.
              </div>

              <p
                style="
                  margin:25px 0 0;
                  color:#6b7280;
                  font-size:13px;
                "
              >
                Regards,<br />

                <strong style="color:#0878d1;">
                  HealthCom Team
                </strong>
              </p>

            </div>

            <!-- FOOTER -->

            <div
              style="
                padding:20px 30px;
                background:#f8fafc;
                border-top:1px solid #edf1f5;
                text-align:center;
                color:#9ca3af;
                font-size:12px;
              "
            >
              © ${new Date().getFullYear()}
              HealthCom. All rights reserved.
            </div>

          </div>

        </div>

      </body>

      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};


// ======================================================
// SUBSCRIPTION PAYMENT SUCCESS EMAIL
// ======================================================


// ======================================================
// SUBSCRIPTION PAYMENT SUCCESS EMAIL
// ======================================================

const sendSubscriptionSuccessEmail = async ({
  email,
  firstName,
  planName,
  amount,
  transactionId,
  endDate,
}) => {

  await transporter.sendMail({
    from: `"HealthCom" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "HealthCom Subscription Activated",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f4f7fb;
            font-family: Arial, Helvetica, sans-serif;
            color: #172033;
        }

        table {
            border-collapse: collapse;
        }

        .wrapper {
            width: 100%;
            padding: 45px 15px;
            background: #f4f7fb;
        }

        .container {
            width: 100%;
            max-width: 650px;
            margin: auto;
            background: #ffffff;
            border: 1px solid #e8edf4;
            border-radius: 20px;
            overflow: hidden;
        }

        .header {
            padding: 28px 38px;
            border-bottom: 1px solid #edf1f6;
            background: #ffffff;
        }

        .logo {
            font-size: 25px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #10233f;
        }

        .logo span {
            color: #2563eb;
        }

        .content {
            padding: 42px 38px;
        }

        .icon {
            width: 58px;
            height: 58px;
            line-height: 58px;
            text-align: center;
            border-radius: 50%;
            background: #ecfdf3;
            color: #16a34a;
            font-size: 28px;
            font-weight: bold;
        }

        .heading {
            margin: 24px 0 10px;
            font-size: 30px;
            line-height: 1.25;
            color: #111827;
        }

        .intro {
            margin: 0;
            font-size: 15px;
            line-height: 1.8;
            color: #667085;
        }

        .badge {
            display: inline-block;
            margin-top: 20px;
            padding: 8px 14px;
            border-radius: 30px;
            background: #ecfdf3;
            color: #15803d;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.6px;
        }

        .card {
            margin-top: 32px;
            border: 1px solid #e6eaf0;
            border-radius: 14px;
            overflow: hidden;
        }

        .card-title {
            padding: 17px 20px;
            background: #f8fafc;
            border-bottom: 1px solid #e6eaf0;
            font-size: 14px;
            font-weight: 700;
            color: #344054;
        }

        .row {
            border-bottom: 1px solid #eef1f5;
        }

        .row:last-child {
            border-bottom: 0;
        }

        .label {
            padding: 17px 20px;
            width: 42%;
            font-size: 13px;
            color: #667085;
        }

        .value {
            padding: 17px 20px;
            text-align: right;
            font-size: 14px;
            font-weight: 700;
            color: #172033;
            word-break: break-word;
        }

        .price {
            color: #2563eb;
            font-size: 17px;
        }

        .info {
            margin-top: 25px;
            padding: 18px 20px;
            border-radius: 10px;
            background: #f8fafc;
            border: 1px solid #edf1f6;
        }

        .info-title {
            margin: 0 0 7px;
            font-size: 13px;
            font-weight: 700;
            color: #344054;
        }

        .info-text {
            margin: 0;
            font-size: 13px;
            line-height: 1.7;
            color: #667085;
        }

        .footer {
            padding: 28px 38px;
            text-align: center;
            background: #f8fafc;
            border-top: 1px solid #edf1f6;
        }

        .footer-brand {
            margin-bottom: 7px;
            font-size: 14px;
            font-weight: 700;
            color: #344054;
        }

        .footer-text {
            margin: 0;
            font-size: 12px;
            line-height: 1.7;
            color: #98a2b3;
        }

        @media only screen and (max-width: 600px) {

            .wrapper {
                padding: 20px 10px;
            }

            .header {
                padding: 24px;
            }

            .content {
                padding: 30px 24px;
            }

            .footer {
                padding: 24px;
            }

            .heading {
                font-size: 25px;
            }

            .label,
            .value {
                padding: 14px 12px;
                font-size: 12px;
            }

            .logo {
                font-size: 22px;
            }
        }
    </style>
</head>

<body>

<table width="100%" cellpadding="0" cellspacing="0" class="wrapper">
    <tr>
        <td align="center">

            <table width="100%" cellpadding="0" cellspacing="0" class="container">

                <!-- BRAND -->
                <tr>
                    <td class="header">

                        <div class="logo">
                            Health<span>Com</span>
                        </div>

                    </td>
                </tr>

                <!-- MAIN -->
                <tr>
                    <td class="content">

                        <div class="icon">
                            ✓
                        </div>

                        <h1 class="heading">
                            Subscription Activated
                        </h1>

                        <p class="intro">
                            Hello Dr. ${firstName},
                            <br><br>
                            Your HealthCom subscription payment has been successfully
                            processed. Your plan is now active and ready to use.
                        </p>

                        <div class="badge">
                            PAYMENT SUCCESSFUL
                        </div>

                        <!-- DETAILS -->
                        <div class="card">

                            <div class="card-title">
                                Subscription Summary
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0">

                                <tr class="row">
                                    <td class="label">
                                        Subscription Plan
                                    </td>

                                    <td class="value">
                                        ${planName}
                                    </td>
                                </tr>

                                <tr class="row">
                                    <td class="label">
                                        Amount Paid
                                    </td>

                                    <td class="value price">
                                        ₹${amount}
                                    </td>
                                </tr>

                                <tr class="row">
                                    <td class="label">
                                        Transaction ID
                                    </td>

                                    <td class="value">
                                        ${transactionId}
                                    </td>
                                </tr>

                                <tr class="row">
                                    <td class="label">
                                        Valid Until
                                    </td>

                                    <td class="value">
                                        ${new Date(endDate).toLocaleDateString("en-IN")}
                                    </td>
                                </tr>

                            </table>

                        </div>

                        <!-- INFO -->
                        <div class="info">

                            <p class="info-title">
                                Your subscription is active
                            </p>

                            <p class="info-text">
                                You can continue using HealthCom's healthcare tools
                                and services according to your selected subscription
                                plan.
                            </p>

                        </div>

                        <p style="
                            margin: 26px 0 0;
                            font-size: 13px;
                            line-height: 1.7;
                            color: #667085;
                        ">
                            Please keep this email for your records. If you need help
                            regarding your subscription or payment, please contact
                            the HealthCom support team.
                        </p>

                    </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                    <td class="footer">

                        <div class="footer-brand">
                            HealthCom
                        </div>

                        <p class="footer-text">
                            Thank you for choosing HealthCom.
                            <br>
                            Better healthcare, connected.
                        </p>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
        `,
  });

};


// ======================================================
// SUBSCRIPTION PAYMENT FAILED EMAIL
// ======================================================

const sendSubscriptionFailureEmail = async ({
  email,
  firstName,
  planName,
  transactionId,
}) => {

  await transporter.sendMail({
    from: `"HealthCom" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "HealthCom Payment Failed",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f4f7fb;
            font-family: Arial, Helvetica, sans-serif;
            color: #172033;
        }

        table {
            border-collapse: collapse;
        }

        .wrapper {
            width: 100%;
            padding: 45px 15px;
            background: #f4f7fb;
        }

        .container {
            width: 100%;
            max-width: 650px;
            margin: auto;
            background: #ffffff;
            border: 1px solid #e8edf4;
            border-radius: 20px;
            overflow: hidden;
        }

        .header {
            padding: 28px 38px;
            border-bottom: 1px solid #edf1f6;
            background: #ffffff;
        }

        .logo {
            font-size: 25px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #10233f;
        }

        .logo span {
            color: #2563eb;
        }

        .content {
            padding: 42px 38px;
        }

        .icon {
            width: 58px;
            height: 58px;
            line-height: 58px;
            text-align: center;
            border-radius: 50%;
            background: #fff1f2;
            color: #dc2626;
            font-size: 28px;
            font-weight: bold;
        }

        .heading {
            margin: 24px 0 10px;
            font-size: 30px;
            line-height: 1.25;
            color: #111827;
        }

        .intro {
            margin: 0;
            font-size: 15px;
            line-height: 1.8;
            color: #667085;
        }

        .badge {
            display: inline-block;
            margin-top: 20px;
            padding: 8px 14px;
            border-radius: 30px;
            background: #fff1f2;
            color: #be123c;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.6px;
        }

        .card {
            margin-top: 32px;
            border: 1px solid #e6eaf0;
            border-radius: 14px;
            overflow: hidden;
        }

        .card-title {
            padding: 17px 20px;
            background: #f8fafc;
            border-bottom: 1px solid #e6eaf0;
            font-size: 14px;
            font-weight: 700;
            color: #344054;
        }

        .row {
            border-bottom: 1px solid #eef1f5;
        }

        .row:last-child {
            border-bottom: 0;
        }

        .label {
            padding: 17px 20px;
            width: 42%;
            font-size: 13px;
            color: #667085;
        }

        .value {
            padding: 17px 20px;
            text-align: right;
            font-size: 14px;
            font-weight: 700;
            color: #172033;
            word-break: break-word;
        }

        .failed {
            color: #dc2626;
        }

        .warning {
            margin-top: 25px;
            padding: 19px 20px;
            border-radius: 10px;
            background: #fff8f8;
            border: 1px solid #fee2e2;
        }

        .warning-title {
            margin: 0 0 7px;
            font-size: 13px;
            font-weight: 700;
            color: #991b1b;
        }

        .warning-text {
            margin: 0;
            font-size: 13px;
            line-height: 1.7;
            color: #667085;
        }

        .next-step {
            margin-top: 20px;
            padding: 19px 20px;
            border-radius: 10px;
            background: #f8fafc;
            border: 1px solid #edf1f6;
        }

        .next-title {
            margin: 0 0 7px;
            font-size: 13px;
            font-weight: 700;
            color: #344054;
        }

        .next-text {
            margin: 0;
            font-size: 13px;
            line-height: 1.7;
            color: #667085;
        }

        .footer {
            padding: 28px 38px;
            text-align: center;
            background: #f8fafc;
            border-top: 1px solid #edf1f6;
        }

        .footer-brand {
            margin-bottom: 7px;
            font-size: 14px;
            font-weight: 700;
            color: #344054;
        }

        .footer-text {
            margin: 0;
            font-size: 12px;
            line-height: 1.7;
            color: #98a2b3;
        }

        @media only screen and (max-width: 600px) {

            .wrapper {
                padding: 20px 10px;
            }

            .header {
                padding: 24px;
            }

            .content {
                padding: 30px 24px;
            }

            .footer {
                padding: 24px;
            }

            .heading {
                font-size: 25px;
            }

            .label,
            .value {
                padding: 14px 12px;
                font-size: 12px;
            }

            .logo {
                font-size: 22px;
            }
        }
    </style>
</head>

<body>

<table width="100%" cellpadding="0" cellspacing="0" class="wrapper">
    <tr>
        <td align="center">

            <table width="100%" cellpadding="0" cellspacing="0" class="container">

                <!-- BRAND -->
                <tr>
                    <td class="header">

                        <div class="logo">
                            Health<span>Com</span>
                        </div>

                    </td>
                </tr>

                <!-- MAIN -->
                <tr>
                    <td class="content">

                        <div class="icon">
                            !
                        </div>

                        <h1 class="heading">
                            Payment Unsuccessful
                        </h1>

                        <p class="intro">
                            Hello Dr. ${firstName},
                            <br><br>
                            We couldn't complete your HealthCom subscription payment.
                            Your selected plan has not been activated from this
                            transaction.
                        </p>

                        <div class="badge">
                            PAYMENT FAILED
                        </div>

                        <!-- DETAILS -->
                        <div class="card">

                            <div class="card-title">
                                Payment Summary
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0">

                                <tr class="row">
                                    <td class="label">
                                        Subscription Plan
                                    </td>

                                    <td class="value">
                                        ${planName}
                                    </td>
                                </tr>

                                <tr class="row">
                                    <td class="label">
                                        Transaction ID
                                    </td>

                                    <td class="value">
                                        ${transactionId}
                                    </td>
                                </tr>

                                <tr class="row">
                                    <td class="label">
                                        Payment Status
                                    </td>

                                    <td class="value failed">
                                        Failed
                                    </td>
                                </tr>

                            </table>

                        </div>

                        <!-- WARNING -->
                        <div class="warning">

                            <p class="warning-title">
                                Important payment information
                            </p>

                            <p class="warning-text">
                                If your bank or payment provider has temporarily
                                deducted the amount, please allow some time for the
                                transaction to be reversed according to your
                                payment provider's processing time.
                            </p>

                        </div>

                        <!-- NEXT STEP -->
                        <div class="next-step">

                            <p class="next-title">
                                What should you do?
                            </p>

                            <p class="next-text">
                                Please try the payment again using your preferred
                                payment method. If the problem continues, verify
                                your payment details or contact HealthCom support.
                            </p>

                        </div>

                        <p style="
                            margin: 26px 0 0;
                            font-size: 13px;
                            line-height: 1.7;
                            color: #667085;
                        ">
                            Please keep your transaction ID for reference. It can
                            help our support team quickly locate your payment attempt.
                        </p>

                    </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                    <td class="footer">

                        <div class="footer-brand">
                            HealthCom
                        </div>

                        <p class="footer-text">
                            Need help with your payment?
                            <br>
                            The HealthCom team is here to assist you.
                        </p>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
        `,
  });

};


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
