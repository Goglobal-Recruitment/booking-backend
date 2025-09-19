// server.js

// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create app and configure
const app = express();
app.use(bodyParser.json());

// In-memory users store (replace with a real database in production)
const users = {}; // { email: { password, verified, verificationCode } }

// Setup nodemailer transporter (use your email config here)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another email provider
  auth: {
    user: 'your-email@gmail.com',      // your email
    pass: 'your-email-app-password'    // app password (for Gmail)
  }
});

// Register endpoint
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (users[email]) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  
  // Generate verification code
  const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  
  // Save user with unverified status
  users[email] = { password, verified: false, verificationCode };
  
  // Send verification email
  const mailOptions = {
    from: 'noreply@booking.com',
    to: email,
    subject: 'Verify your email - Booking.com clone',
    text: `Your verification code is: ${verificationCode}`
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: 'Error sending email' });
    }
    res.json({ message: 'Verification code sent to your email' });
  });
});

// Verify email endpoint
app.post('/verify', (req, res) => {
  const { email, code } = req.body;
  const user = users[email];
  if (!user) return res.status(400).json({ message: 'User not found' });
  if (user.verified) return res.json({ message: 'User already verified' });
  if (user.verificationCode === code) {
    user.verified = true;
    return res.json({ message: 'Email verified successfully' });
  }
  res.status(400).json({ message: 'Invalid verification code' });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  if (!user) return res.status(400).json({ message: 'User not found' });
  if (!user.verified) return res.status(400).json({ message: 'Please verify your email first' });
  if (user.password !== password) return res.status(400).json({ message: 'Incorrect password' });
  res.json({ message: 'Login successful' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
