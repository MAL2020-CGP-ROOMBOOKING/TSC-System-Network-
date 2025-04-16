const mongoose = require("mongoose");

// Define a schema for additional users who will be using the room.
const AdditionalUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  { _id: false } // We don't need a separate _id for each subdocument.
);

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },
    date: {
      type: String,
      required: true // e.g. "DD/MM/YYYY"
    },
    timeSlot: {
      type: String,
      required: true // e.g. "HH:mm AM/PM"
    },
    status: {
      type: String,
      enum: ["Pending", "Booked", "Rejected", "Expired", "Completed"],
      default: "Pending"
    },
    // Additional users who will be using the room.
    // Must have a minimum of 4 and a maximum of 8 entries.
    additionalUsers: {
      type: [AdditionalUserSchema],
      required: true,
      validate: {
        validator: function(v) {
          return v.length >= 4 && v.length <= 8;
        },
        message: props =>
          `Additional users must be between 4 and 8 entries. Provided: ${props.value.length}.`
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);
