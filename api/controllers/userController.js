const User = require("../models/User");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/emailService");
const jwt = require("jsonwebtoken");

// REGISTER A NEW USER OR ADMIN
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, isAdmin } = req.body;

    // Ensure role is assigned correctly
    const role = Boolean(isAdmin) ? "admin" : "user"; 

    // Check if the email already exists 
    const userExists = (await User.findOne({ email })) || (await Admin.findOne({ email }));
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser;
    if (role === "admin") {
      newUser = new Admin({
        name,
        email,
        phone,
        password: hashedPassword,
        role, // Store role explicitly in DB
      });
    } else {
      newUser = new User({
        name,
        email,
        phone,
        password: hashedPassword,
        role, // Store role explicitly in DB
      });
    }

    await newUser.save();

    // Send a formal HTML welcome email to the user
    try {
      const htmlMessage = `
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Welcome to Our System</title>
  </head>
  <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f7f7f7;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; margin-top:20px; box-shadow:0 0 10px rgba(0,0,0,0.1);">
      <tr>
        <td align="center" style="padding:20px 0; background-color:#007BFF; color:#ffffff;">
          <h1 style="margin:0;">Welcome to Our System</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 30px;">
          <p style="font-size:16px;">Dear ${name},</p>
          <p style="font-size:16px;">
            Your account has been successfully created with the role of <strong>${role}</strong>.
          </p>
          <p style="font-size:16px;">
            We are thrilled to have you on board. Please feel free to log in and explore the system.
          </p>
          <p style="font-size:16px;">
            If you have any questions, our support team is always available to help.
          </p>
          <p style="font-size:16px;">Thank you for choosing our system.</p>
          <p style="font-size:16px;">Sincerely,<br/>The Team</p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:10px; background-color:#f0f0f0;">
          <p style="font-size:14px; color:#666; margin:0;">&copy; 2025 Your Company. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
      `;
      await sendEmail(email, "Welcome to Our System", htmlMessage);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);
    }

    res.status(201).json({ message: `Registration successful as ${role}` });
  } catch (error) {
    console.error("❌ Registration error:", error.stack);
    res.status(500).json({ message: "Server Error" });
  }
};

// LOGIN USER OR ADMIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    let role = "user"; // Default role

    // If user not found, check in admin collection
    if (!user) {
      user = await Admin.findOne({ email });
      role = "admin"; 
    }

    // If no user/admin found
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare input password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Ensure role is stored in DB
    if (!user.role) {
      return res.status(500).json({ message: "Role is missing in the database!" });
    }

    // Generate JWT token include role
    const token = jwt.sign(
      { id: user._id, role: user.role }, // Ensure role is included
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({ token, userId: user._id, role: user.role });
  } catch (error) {
    console.error("❌ Login error:", error.stack);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { registerUser, loginUser };
