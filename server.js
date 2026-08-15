require('dotenv').config();

const cors = require('cors');
const cookieParser = require("cookie-parser");
const express = require('express');
const http = require("http");
const { Server } = require("socket.io");

const connectDatabase = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require("./routes/profileRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const findDoctorRoutes = require("./routes/findDoctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const aiHealthRoutes = require("./routes/aiHealthRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const callRoutes = require("./routes/callRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");

// ==============================================
// Doctor Panel Routes
// ==============================================

const doctorSubscriptionRoutes = require( "./doctor/routes/subscriptionRoutes.js");
const doctordashboardRoute = require("./doctor/routes/doctorRoutes.js");
const doctorAppointmentRoutes = require("./doctor/routes/doctorAppointmentRoutes");

const app = express();

const port =
  process.env.PORT || 5000;


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cookieParser());

const allowedOrigins = [
    "https://sage-melomakarona-a9724e.netlify.app"
];

app.use(
    cors({
        origin: function (origin, callback) {

            // Postman / server-to-server requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("❌ CORS blocked:", origin);

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With"
        ]
    })
);

app.use(
  express.json({
    limit: '20kb',
  })
);

app.use(
    express.urlencoded({
        extended: true,
    })
);


// =========================================================
// HEALTH
// =========================================================

app.get(
  '/api/health',
  (req, res) => {

    res.json({
      status: 'ok',
    });

  }
);


// =========================================================
// EXISTING ROUTES
// =========================================================

app.use('/api/auth', authRoutes);

app.use(
  "/api/profile",
  profileRoutes
);

app.use(
  "/api/doctors",
  doctorRoutes
);

app.use(
  "/api/find-doctors",
  findDoctorRoutes
);

app.use(
  "/api/appointments",
  appointmentRoutes
);

app.use(
  "/api/ai-health",
  aiHealthRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);


// =========================================================
// VIDEO CALL ROUTES
// =========================================================

app.use(
  "/api/calls",
  callRoutes
);

// =========================================================
// PrescriptionRoutes ROUTES
// =========================================================

app.use(
  "/api/prescriptions",
  prescriptionRoutes
);

// =========================================================
// Doctor Panel Routes 
// =========================================================

app.use(
  "/api/doctor/",
  doctorSubscriptionRoutes,
  doctordashboardRoute,
  doctorAppointmentRoutes,
);


// =========================================================
// HTTP SERVER
// =========================================================

const server =
  http.createServer(app);


// =========================================================
// SOCKET.IO
// =========================================================

const io =
  new Server(server, {

    cors: {

      origin:
        process.env.CLIENT_URL ||
        "http://localhost:5173",

      methods: [
        "GET",
        "POST",
      ],

      credentials: true,

    },

  });


app.set(
  "io",
  io
);

// =========================================================
// SOCKET CONNECTION
// =========================================================

io.on(
  "connection",
  (socket) => {

    console.log(
      "Socket connected:",
      socket.id
    );



    // =====================================================
    // PATIENT REAL-TIME ROOM
    // =====================================================

    socket.on(
      "join-patient-room",
      ({
        patientId,
      }) => {

        if (!patientId) {

          console.warn(
            "join-patient-room without patientId"
          );

          return;

        }


        const room =
          `patient:${patientId}`;


        socket.join(
          room
        );


        socket.data.patientId =
          patientId;


        console.log(
          "Patient joined realtime room:",
          {
            socketId:
              socket.id,

            patientId,

            room,
          }
        );

      }
    );



    socket.on(
      "join-patient-room",
      ({ patientId }) => {

        if (!patientId) {
          return;
        }

        const room =
          `patient:${patientId}`;

        socket.join(room);

        socket.data.patientId =
          patientId;

        console.log(
          "PATIENT PRESCRIPTION ROOM JOINED:",
          {
            socketId: socket.id,
            patientId,
            room,
          }
        );

      }
    );


    // =====================================================
    // JOIN CALL ROOM
    // =====================================================

    socket.on(
      "join-call",
      ({
        roomId,
        userId,
        role,
      }) => {

        if (!roomId) {

          console.warn(
            "join-call received without roomId"
          );

          return;

        }


        // =================================================
        // JOIN ROOM
        // =================================================

        socket.join(
          roomId
        );


        // =================================================
        // SAVE SOCKET DATA
        // =================================================

        socket.data.roomId =
          roomId;

        socket.data.userId =
          userId;

        socket.data.role =
          role;


        console.log(
          "USER JOINED CALL:",
          {
            socketId:
              socket.id,

            userId,

            role,

            roomId,
          }
        );


        // =================================================
        // TELL OTHER USER
        // =================================================

        socket
          .to(roomId)
          .emit(
            "user-joined",
            {
              socketId:
                socket.id,

              userId,

              role,
            }
          );

      }
    );


    // =====================================================
    // WEBRTC OFFER
    // =====================================================

    socket.on(
      "offer",
      ({
        roomId,
        offer,
      }) => {

        if (
          !roomId ||
          !offer
        ) {
          return;
        }


        console.log(
          "WebRTC offer:",
          roomId
        );


        socket
          .to(roomId)
          .emit(
            "offer",
            {
              offer,
            }
          );

      }
    );


    // =====================================================
    // WEBRTC ANSWER
    // =====================================================

    socket.on(
      "answer",
      ({
        roomId,
        answer,
      }) => {

        if (
          !roomId ||
          !answer
        ) {
          return;
        }


        console.log(
          "WebRTC answer:",
          roomId
        );


        socket
          .to(roomId)
          .emit(
            "answer",
            {
              answer,
            }
          );

      }
    );


    // =====================================================
    // ICE CANDIDATE
    // =====================================================

    socket.on(
      "ice-candidate",
      ({
        roomId,
        candidate,
      }) => {

        if (
          !roomId ||
          !candidate
        ) {
          return;
        }


        socket
          .to(roomId)
          .emit(
            "ice-candidate",
            {
              candidate,
            }
          );

      }
    );


    // =====================================================
    // END CALL
    // =====================================================

    socket.on(
      "end-call",
      ({
        roomId,
      }) => {

        if (!roomId) {
          return;
        }


        console.log(
          "CALL ENDED:",
          roomId
        );


        socket
          .to(roomId)
          .emit(
            "call-ended"
          );

      }
    );


    // =====================================================
    // DISCONNECT
    // =====================================================

    socket.on(
      "disconnect",
      (reason) => {

        const roomId =
          socket.data.roomId;


        console.log(
          "Socket disconnected:",
          {
            socketId:
              socket.id,

            reason,

            roomId,
          }
        );


        if (roomId) {

          socket
            .to(roomId)
            .emit(
              "user-left"
            );

        }

      }
    );

  }
);

// =========================================================
// DATABASE + SERVER
// =========================================================

connectDatabase()

  .then(() => {

    server.listen(
      port,
      "0.0.0.0",
      () => {

        console.log(
          `HealthCom backend running on http://localhost:${port}`
        );

        console.log(
          "Socket.IO video call server is running."
        );

      }
    );

  })

  .catch((error) => {

    console.error(
      'Database connection failed:',
      error.message
    );

    process.exit(1);

  });
