require('dotenv').config(); // Load .env variables

const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
app.use(bodyParser.json());

// Twilio client setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

// In-memory store (for demo). Use a proper DB in production.
const otps = {};

// 1) Endpoint to send OTP
app.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP with expiration (5 minutes from now)
    otps[phoneNumber] = {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes in ms
    };

    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return res.json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

// 2) Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP are required.' });
  }

  const record = otps[phoneNumber];
  if (!record) {
    return res.status(400).json({ success: false, message: 'No OTP found for this number.' });
  }

  // Check if OTP is expired
  if (Date.now() > record.expiresAt) {
    delete otps[phoneNumber]; // Clear expired OTP
    return res.status(400).json({ success: false, message: 'OTP has expired.' });
  }

  // Check if OTP matches
  if (record.code === otp) {
    // Success
    delete otps[phoneNumber]; // Clear OTP after successful verification
    return res.json({ success: true, message: 'OTP verified successfully.' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Twilio SMS Auth server running on port ${PORT}`);
});
