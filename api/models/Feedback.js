// models/Feedback.js
const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    anonymous: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ["Bug Report", "Feature Request", "General Suggestion", "Other"], 
      default: "Other"
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    rating: { type: Number, min: 1, max: 4 }, // if you're storing 1-4 for emojis
    attachment: { type: String },
    status: { type: String, enum: ["Pending", "Reviewed", "Resolved"], default: "Pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
