const Groq = require("groq-sdk");

const AIHealthMessage = require("../models/AIHealthMessage");
const User = require("../models/User");


// =========================================================
// GROQ CLIENT
// =========================================================

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});


// =========================================================
// AI HEALTH CHAT
// =========================================================

const chatWithAIHealth = async (req, res) => {

    try {

        const {
            patientId,
            sessionId,
            message,
        } = req.body;


        console.log(
            "AI HEALTH CHAT:",
            {
                patientId,
                sessionId,
                message,
            }
        );


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !patientId ||
            !sessionId ||
            !message
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Patient ID, session ID and message are required.",

            });

        }


        // =================================================
        // CHECK MESSAGE LENGTH
        // =================================================

        if (
            typeof message !== "string" ||
            message.trim().length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid message.",

            });

        }


        if (message.length > 3000) {

            return res.status(400).json({

                success: false,

                message:
                    "Message is too long. Please keep it under 3000 characters.",

            });

        }


        // =================================================
        // CHECK PATIENT
        // =================================================

        const patient =
            await User.findOne({

                _id: patientId,

                role: "patient",

            });


        if (!patient) {

            return res.status(404).json({

                success: false,

                message:
                    "Patient not found.",

            });

        }


        // =================================================
        // SAVE USER MESSAGE
        // =================================================

        await AIHealthMessage.create({

            patientId: patientId,

            sessionId: sessionId,

            role: "user",

            message: message.trim(),

        });


        // =================================================
        // GET PREVIOUS CHAT
        // =================================================

        const previousMessages =
            await AIHealthMessage.find({

                patientId: patientId,

                sessionId: sessionId,

            })
                .sort({
                    createdAt: 1,
                })
                .limit(20);


        // =================================================
        // CREATE AI CONVERSATION
        // =================================================

        const conversation = [

            {
                role: "system",

                content: `
You are HealthCom AI Health Assistant.

You are an AI health information assistant, NOT a doctor.

Your job is to:
- Understand the patient's health-related message.
- Provide general health information.
- Ask useful follow-up questions when necessary.
- Suggest safe next steps.
- Encourage professional medical consultation when appropriate.
- Keep responses simple and easy to understand.

IMPORTANT SAFETY RULES:

1. Never claim to diagnose a disease.
2. Never say that the patient definitely has a specific disease.
3. Never prescribe prescription medicines.
4. Never recommend changing or stopping prescribed medication.
5. For severe or emergency symptoms, recommend immediate emergency medical care.
6. Clearly mention uncertainty when symptoms can have multiple causes.
7. Do not create unnecessary fear.
8. Do not pretend to be a human doctor.
9. Do not provide a medical diagnosis from symptoms alone.
10. If the patient describes potentially serious symptoms such as severe chest pain, difficulty breathing, severe bleeding, loss of consciousness, sudden weakness, seizure, or similar emergency signs, tell them to seek urgent medical care immediately.

Response style:

- Be concise.
- Use simple language.
- Use short paragraphs.
- Use bullet points when useful.
- Ask follow-up questions if important information is missing.
- Do not overwhelm the patient.

At the end of relevant health responses, remind the patient:

"This information is for general health guidance and is not a medical diagnosis."

Patient name:
${patient.firstName || "Patient"}
                `,
            },

            ...previousMessages.map(
                (item) => ({

                    role:
                        item.role,

                    content:
                        item.message,

                })
            ),

        ];


        // =================================================
        // CALL GROQ
        // =================================================

        const completion =
            await groq.chat.completions.create({

                model:
                    "openai/gpt-oss-20b",

                messages:
                    conversation,

                temperature:
                    0.3,

                max_tokens:
                    700,

            });


        const aiMessage =
            completion
                ?.choices?.[0]
                ?.message
                ?.content;


        // =================================================
        // CHECK AI RESPONSE
        // =================================================

        if (!aiMessage) {

            throw new Error(
                "AI returned an empty response."
            );

        }


        // =================================================
        // SAVE AI MESSAGE
        // =================================================

        const savedAIMessage =
            await AIHealthMessage.create({

                patientId: patientId,

                sessionId: sessionId,

                role: "assistant",

                message:
                    aiMessage.trim(),

            });


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "AI response generated successfully.",

            reply:
                savedAIMessage.message,

            data: {

                id:
                    savedAIMessage._id,

                role:
                    savedAIMessage.role,

                message:
                    savedAIMessage.message,

                createdAt:
                    savedAIMessage.createdAt,

            },

        });


    } catch (error) {

        console.error(
            "AI Health Chat Error:",
            error
        );


        // =================================================
        // GROQ ERROR
        // =================================================

        if (
            error?.status === 401
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "AI service authentication failed. Please check GROQ_API_KEY.",

            });

        }


        if (
            error?.status === 429
        ) {

            return res.status(429).json({

                success: false,

                message:
                    "AI service rate limit reached. Please try again shortly.",

            });

        }


        // =================================================
        // GENERAL ERROR
        // =================================================

        return res.status(500).json({

            success: false,

            message:
                "Unable to generate AI health response.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,

        });

    }

};


// =========================================================
// GET CHAT HISTORY
// =========================================================

const getAIHealthHistory = async (
    req,
    res
) => {

    try {

        const {
            patientId,
            sessionId,
        } = req.params;


        if (
            !patientId ||
            !sessionId
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Patient ID and session ID are required.",

            });

        }


        const messages =
            await AIHealthMessage.find({

                patientId:
                    patientId,

                sessionId:
                    sessionId,

            })
                .sort({
                    createdAt: 1,
                });


        return res.status(200).json({

            success: true,

            count:
                messages.length,

            messages,

        });


    } catch (error) {

        console.error(
            "AI Health History Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch AI health history.",

        });

    }

};


module.exports = {

    chatWithAIHealth,

    getAIHealthHistory,

};