const User = require("../models/User");
const Admin = require("../models/Admin"); // ✅ Add this
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/emailService");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000"; // ✅ Fallback for dev

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, phone, password: hashedPassword, role: "user" });

    await newUser.save();

    const htmlMessage = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color:#f7f7f7; padding:20px;">
          <table width="100%" style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,0.1);">
            <tr><td style="background:#007BFF;color:#fff;padding:20px;text-align:center;border-top-left-radius:10px;border-top-right-radius:10px;">
              <h2>Welcome to Our System</h2></td></tr>
            <tr><td style="padding:30px;">
              <p>Hi ${name},</p>
              <p>Thank you for registering as a <strong>user</strong>. Your account is now active!</p>
              <p>If you need help, feel free to reach out to our team anytime.</p>
              <p>Cheers,<br/>TSC Team</p>
            </td></tr>
            <tr><td style="background:#f0f0f0;color:#555;text-align:center;padding:10px;border-bottom-left-radius:10px;border-bottom-right-radius:10px;">
              &copy; 2025 TSC ROOM SYSTEM</td></tr>
          </table>
        </body>
      </html>
    `;

    await sendEmail(email, "Welcome to Our System", htmlMessage);
    res.status(201).json({ message: "Registration successful as user" });

  } catch (error) {
    console.error("❌ Registration error:", error.stack);
    res.status(500).json({ message: "Server Error" });
  }
};

// LOGIN (user or admin)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    let role = "user";

    if (!user) {
      user = await Admin.findOne({ email });
      role = "admin";
    }

    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "2h" });

    res.status(200).json({ token, userId: user._id, role });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    const resetLink = `${BASE_URL}/pages/reset-password.html?token=${token}&email=${email}`;

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color:#f7f7f7; padding:20px;">
          <table width="100%" style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,0.1);">
            <tr><td style="background:#007BFF;color:#fff;padding:20px;text-align:center;border-top-left-radius:10px;border-top-right-radius:10px;">
              <h2>Reset Your Password</h2></td></tr>
            <tr><td style="padding:30px;">
              <p>Hi,</p>
              <p>We received a request to reset your password. Click below to choose a new one:</p>
              <p style="text-align:center;">
                <a href="${resetLink}" style="display:inline-block;background:#007BFF;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Reset Password</a>
              </p>
              <p>This link will expire in 15 minutes.</p>
              <p>If you didn't request a reset, ignore this message.</p>
            </td></tr>
            <tr><td style="background:#f0f0f0;color:#555;text-align:center;padding:10px;border-bottom-left-radius:10px;border-bottom-right-radius:10px;">
              &copy; 2025 TSC ROOM SYSTEM</td></tr>
          </table>
        </body>
      </html>
    `;

    await sendEmail(email, "Password Reset Request", htmlContent);
    res.json({ message: "Reset link sent to email" });

  } catch (err) {
    console.error("❌ Forgot password error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("❌ Reset password error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};
