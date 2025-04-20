const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    anonymous: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      enum: ["Bug Report", "Feature Request", "General Suggestion", "Other"], 
      default: "Other",
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 4,
      default: null
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Resolved"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
