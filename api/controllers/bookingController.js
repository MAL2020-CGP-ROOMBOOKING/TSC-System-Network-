const Booking = require("../models/Booking");
const Room = require("../models/Room"); // Import Room model
const User = require("../models/User");
const Admin = require("../models/Admin");
const sendEmail = require("../utils/emailService");

// Fetch available and booked slots for a room
const getRoomSchedule = async (req, res) => {
  try {
    const { room, start, end } = req.query;
    if (!room || !start || !end) {
      return res.status(400).json({ message: "Missing required parameters: room, start, end" });
    }
    console.log(`Fetching schedule for Room: ${room}, From: ${start}, To: ${end}`);
    // Note: With DD/MM/YYYY, lexicographical comparisons may not work as intended.
    const bookings = await Booking.find({
      room,
      date: { $gte: start, $lte: end }
    });
    res.json({ bookings });
  } catch (error) {
    console.error("Error fetching room schedule:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Book a room (Multiple Time Slots Supported across different dates) & Notify Admin
const bookRoom = async (req, res) => {
  try {
    // Expecting a payload with "bookings" array and "additionalUsers" array;
    // each booking object should include a date and a timeSlot.
    const { userId, room, bookings, additionalUsers } = req.body;
    if (!userId || !room || !bookings || !Array.isArray(bookings) || bookings.length === 0) {
      return res.status(400).json({ message: "Missing required fields: userId, room, bookings" });
    }
    // Validate additional users: must be between 4 and 8 entries.
    if (!additionalUsers || additionalUsers.length < 4 || additionalUsers.length > 8) {
      return res.status(400).json({ message: "Please provide between 4 and 8 additional users." });
    }
    // Validate each booking object.
    for (const booking of bookings) {
      if (!booking.date || !booking.timeSlot) {
        return res.status(400).json({ message: "Each booking must include a date and timeSlot" });
      }
    }

    console.log(`Checking availability for Room: ${room} for bookings: ${JSON.stringify(bookings)}`);

    // Build an $or query to check if any requested slot is already booked.
    const orConditions = bookings.map(b => ({ date: b.date, timeSlot: b.timeSlot }));
    const existingBookings = await Booking.find({ room, $or: orConditions });
    if (existingBookings.length > 0) {
      return res.status(400).json({ message: "One or more selected slots are already booked!" });
    }

    // Check the user's existing bookings to enforce a maximum of 3 slots per day.
    const bookingsByDate = {};
    bookings.forEach(b => {
      bookingsByDate[b.date] = (bookingsByDate[b.date] || 0) + 1;
    });
    for (const [dateString, requestedSlots] of Object.entries(bookingsByDate)) {
      // Count existing bookings for that user on the same day (excluding Rejected bookings)
      const existingCount = await Booking.countDocuments({
        user: userId,
        date: dateString,
        status: { $ne: "Rejected" }
      });
      if (existingCount + requestedSlots > 3) {
        return res.status(400).json({
          message: `You cannot book more than 3 slots in a single day. Already booked: ${existingCount} on ${dateString}, trying to add: ${requestedSlots}.`
        });
      }
    }

    // Retrieve the room's name from the database.
    const roomDoc = await Room.findById(room).select("name");
    const roomName = roomDoc ? roomDoc.name : "Unknown Room";

    // Create new booking documents for each requested slot.
    const newBookings = bookings.map(b => ({
      user: userId,
      room,
      date: b.date,
      timeSlot: b.timeSlot,
      status: "Pending",
      additionalUsers // Attach the additional users info
    }));
    await Booking.insertMany(newBookings);
    console.log("Booking requests created successfully.");

    // Fetch the user's name from the User collection (or Admin if not found)
    let userDoc = await User.findById(userId);
    if (!userDoc) {
      userDoc = await Admin.findById(userId);
    }
    const userName = userDoc ? userDoc.name : "Unknown User";

    // Build a list of additional participants as an HTML list.
    const participantListHtml = additionalUsers
      .map(p => `<li>${p.name} (${p.phone}, ${p.email})</li>`)
      .join("");

    // Notify Admin with a formal HTML email.
    const admins = await Admin.find();
    const adminEmails = admins.map(admin => admin.email);
    const htmlMessage = `
<html>
  <head>
    <meta charset="UTF-8" />
    <title>New Room Booking Request</title>
  </head>
  <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f7f7f7;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"
           style="background-color:#ffffff; margin-top:20px; box-shadow:0 0 10px rgba(0,0,0,0.1);">
      <tr>
        <td align="center" style="padding:20px 0; background-color:#007BFF; color:#ffffff;">
          <h1 style="margin:0;">New Booking Request</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 30px;">
          <p style="font-size:16px;">
            A new booking request has been made for Room: <strong>${roomName}</strong>.
          </p>
          <p style="font-size:16px;">
            Requested by: <strong>${userName}</strong>.
          </p>
          <p style="font-size:16px;">Booking Details:</p>
          <ul style="font-size:16px; padding-left:1.2em;">
            ${bookings.map(b => `<li>Date: ${b.date}, Time: ${b.timeSlot}</li>`).join('')}
          </ul>
          <p style="font-size:16px;">Additional Participants:</p>
          <ul style="font-size:16px; padding-left:1.2em;">
            ${participantListHtml}
          </ul>
          <p style="font-size:16px;">Please review the booking request for approval.</p>
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
    try {
      await sendEmail(adminEmails, "New Room Booking Request", htmlMessage);
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError);
    }

    res.status(201).json({ message: "Booking request sent. Waiting for admin approval." });
  } catch (error) {
    console.error("Error booking room:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get User's Upcoming & Past Bookings
const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.query || req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    console.log(`Fetching bookings for User ID: ${userId}`);
    const upcomingBookings = await Booking.find({ user: userId, status: { $ne: "Completed" } }).sort("date timeSlot");
    const bookingHistory = await Booking.find({ user: userId, status: "Completed" }).sort("-date -timeSlot");
    res.json({ upcoming: upcomingBookings, history: bookingHistory });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel Booking
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);
    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json({ message: "Booking canceled successfully!" });
  } catch (error) {
    console.error("Error canceling booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Booking Request (Requires Admin Approval)
const updateBooking = async (req, res) => {
  try {
    const { bookingId, newTime } = req.body;
    if (!bookingId || !newTime) {
      return res.status(400).json({ message: "Booking ID and new time slot are required" });
    }
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { timeSlot: newTime, status: "Pending" },
      { new: true }
    );
    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json({ message: "Booking update request sent for admin approval." });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getRoomSchedule,
  bookRoom,
  getUserBookings,
  cancelBooking,
  updateBooking
};
