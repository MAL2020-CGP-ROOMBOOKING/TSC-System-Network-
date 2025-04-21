const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  createFeedback,
  getAllFeedback,
  deleteFeedback,
  updateFeedbackStatus, 
} = require("../controllers/feedbackController");

const authMiddleware = require("../middlewares/authMiddleware");

// Multer setup (optional if no file needed, keep for future flexibility)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// ✅ Create feedback (user) — supports optional file upload
router.post("/", upload.single("attachment"), authMiddleware, createFeedback);

// ✅ Get all feedback (admin)
router.get("/", authMiddleware, getAllFeedback);

// ✅ Delete feedback by ID (admin)
router.delete("/:id", authMiddleware, deleteFeedback);

// ✅ Update feedback status (admin)
router.patch("/status/:id", authMiddleware, updateFeedbackStatus);

module.exports = router;
