const express = require("express");
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword
} = require("../controllers/userController");

const router = express.Router();

// 🔐 Authentication Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// 🔁 Password Reset Routes
router.post("/forgot-password", forgotPassword); // Step 1: Send reset email
router.post("/reset-password", resetPassword);   // Step 2: Set new password

module.exports = router;
