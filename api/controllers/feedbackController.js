const Feedback = require("../models/Feedback");
const sendEmail = require("../utils/emailService");

/**
 * Create new feedback (no file upload)
 */
const createFeedback = async (req, res) => {
  try {
    const { category, subject, message, rating, anonymous } = req.body;

    if (!category || !subject || !message) {
      return res.status(400).json({ message: "Category, subject, and message are required." });
    }

    const feedbackData = {
      category,
      subject,
      message,
      rating: rating || null,
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
 * Get all feedback (admin)
 */
const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error("❌ Error fetching feedback:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Delete feedback by ID
 */
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Invalid feedback ID" });
    }

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
 * Update feedback status (admin)
 */
const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Reviewed", "Resolved"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updated = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Status updated successfully", feedback: updated });
  } catch (error) {
    console.error("❌ Error updating status:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createFeedback,
  getAllFeedback,
  deleteFeedback,
  updateFeedbackStatus, // ✅ Exported
};
