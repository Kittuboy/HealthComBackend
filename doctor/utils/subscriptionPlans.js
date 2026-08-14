const DOCTOR_PLANS = {
    free: {
        id: "free",
        name: "Free",
        price: 0,
        durationDays: null,

        features: {
            appointments: 5,
            patients: 10,
            videoConsultations: 3,
            prescriptions: true,
            medicalRecords: true,
            earnings: false,
            analytics: false,
            prioritySupport: false,
        },
    },

    basic: {
        id: "basic",
        name: "Basic",
        price: 499,
        durationDays: 30,

        features: {
            appointments: 50,
            patients: 100,
            videoConsultations: true,
            prescriptions: true,
            medicalRecords: true,
            earnings: true,
            analytics: false,
            prioritySupport: false,
        },
    },

    professional: {
        id: "professional",
        name: "Professional",
        price: 999,
        durationDays: 30,

        features: {
            appointments: -1,
            patients: -1,
            videoConsultations: true,
            prescriptions: true,
            medicalRecords: true,
            earnings: true,
            analytics: true,
            prioritySupport: true,
        },
    },
};

module.exports = DOCTOR_PLANS;