const express = require("express");
const router = express.Router();
const multer = require("multer");

const { createFeedback, getAllFeedback, deleteFeedback } = require("../controllers/feedbackController"); // ✅ Added deleteFeedback
const authMiddleware = require("../middlewares/authMiddleware");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// ✅ POST: Create feedback
router.post("/", upload.single("attachment"), createFeedback);

// ✅ GET: Fetch all feedback
router.get("/", authMiddleware, getAllFeedback);

// 🔥 FIXED: DELETE route (this was missing)
router.delete("/:id", authMiddleware, deleteFeedback);

module.exports = router;
