require('dotenv').config(); // Load .env variables

const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const CryptoJS = require('crypto-js');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());

// Twilio setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

// AES key (should be 16, 24, or 32 chars long)
const AES_SECRET_KEY = CryptoJS.enc.Utf8.parse(process.env.AES_SECRET_KEY);

// In-memory OTP store
const otps = {};

// Encrypt OTP with AES
function encryptOTP(otp) {
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(otp, AES_SECRET_KEY, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return CryptoJS.enc.Base64.stringify(iv.concat(encrypted.ciphertext));
}

// 1) Send Encrypted OTP via Twilio
app.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    // Generate and encrypt OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const encryptedOtp = encryptOTP(otp);
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store hashed OTP and expiry
    otps[phoneNumber] = {
      hash: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    // Send encrypted OTP via SMS
    await twilioClient.messages.create({
      body: `Your secure OTP: ${encryptedOtp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return res.json({ success: true, message: 'Encrypted OTP sent via SMS.' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

// 2) Verify decrypted OTP
app.post('/verify-otp', async (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP are required.' });
  }

  const record = otps[phoneNumber];
  if (!record) {
    return res.status(400).json({ success: false, message: 'No OTP found for this number.' });
  }

  // Check expiration
  if (Date.now() > record.expiresAt) {
    delete otps[phoneNumber];
    return res.status(400).json({ success: false, message: 'OTP has expired.' });
  }

  // Compare hashed OTP
  const isMatch = await bcrypt.compare(otp, record.hash);
  if (isMatch) {
    delete otps[phoneNumber];
    return res.json({ success: true, message: 'OTP verified successfully.' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Secure OTP server running on port ${PORT}`);
});
