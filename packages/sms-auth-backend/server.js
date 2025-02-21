require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("./firebase-config");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 📌 Send OTP using Firebase Authentication
app.post("/send-otp", async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
    }

    try {
        const session = await admin.auth().createSessionCookie(phone, { expiresIn: 300000 }); // 5 min expiration
        res.json({ success: true, session });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: error.message });
    }
});

// 📌 Verify OTP using Firebase Authentication
app.post("/verify-otp", async (req, res) => {
    const { session, otp } = req.body;
    if (!session || !otp) {
        return res.status(400).json({ error: "Session and OTP are required" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(session);
        if (!decodedToken.phone_number) {
            throw new Error("Invalid session");
        }

        res.json({ verified: true, message: "OTP verification successful" });
    } catch (error) {
        res.status(400).json({ verified: false, message: "Invalid OTP" });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
