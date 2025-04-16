const Feedback = require("../models/Feedback");
const sendEmail = require("../utils/emailService");

/**
 * Delete feedback by ID
 */
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Invalid feedback ID" });
    }

    // Find and delete feedback
    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Feedback deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting feedback:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Create new feedback
 */
const createFeedback = async (req, res) => {
  try {
    const { category, subject, message, rating, anonymous } = req.body;

    let attachment = "";
    if (req.file) {
      attachment = req.file.path;
    }

    const feedbackData = {
      category,
      subject,
      message,
      rating,
      attachment,
      status: "Pending",
    };

    if (!anonymous && req.user?._id) {
      feedbackData.user = req.user._id;
    } else {
      feedbackData.anonymous = true;
    }

    const feedback = new Feedback(feedbackData);
    await feedback.save();

    res.status(201).json({ message: "Feedback submitted successfully." });
  } catch (error) {
    console.error("❌ Error submitting feedback:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Get all feedback (for admin)
 */
const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error("❌ Error fetching feedback:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createFeedback,
  getAllFeedback,
  deleteFeedback, // 🔥 Export delete function
};
