const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Announcement = require("../models/Announcement"); // Ensure this model exists
const sendEmail = require("../utils/emailService");

// =============== UTILS FOR BOOKING STATUS UPDATES ===============
function parseBookingDateTime(booking) {
  // booking.date example: "05/03/2025"
  // booking.timeSlot example: "06:00 PM"
  const [dd, mm, yyyy] = booking.date.split("/");
  const dateObj = new Date(`${yyyy}-${mm}-${dd}`); // e.g. "2025-03-05"

  // Now parse the time slot "HH:MM AM/PM"
  const [timePart, ampm] = booking.timeSlot.split(" ");
  const [hourStr, minuteStr] = timePart.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (ampm.toUpperCase() === "PM" && hour !== 12) {
    hour += 12;
  } else if (ampm.toUpperCase() === "AM" && hour === 12) {
    hour = 0; // 12 AM is 00:00
  }

  dateObj.setHours(hour, minute, 0, 0);
  return dateObj;
}

async function updatePastBookings() {
  // Find all active bookings that might need updating
  const activeBookings = await Booking.find({
    status: { $in: ["Pending", "Booked"] }
  });

  const now = new Date();

  for (const booking of activeBookings) {
    const bookingDateTime = parseBookingDateTime(booking);
    if (bookingDateTime < now) {
      if (booking.status === "Pending") {
        booking.status = "Expired";
      } else if (booking.status === "Booked") {
        booking.status = "Completed";
      }
      await booking.save();
    }
  }
}

// =============== ADMIN DASHBOARD DATA ===============
const getAdminDashboard = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const totalUsers = await User.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: "Pending" });
    const completedBookings= await Booking.countDocuments({ status: "Completed" });

    res.json({ totalRooms, totalUsers, pendingBookings, completedBookings });
  } catch (error) {
    console.error("❌ Error fetching admin dashboard data:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============== GET ALL BOOKINGS (FOR ADMIN) ===============
const getAllBookings = async (req, res) => {
  try {
    // 1) Update any past bookings to "Expired"/"Completed" first
    await updatePastBookings();

    // 2) Fetch the (possibly updated) bookings
    const bookings = await Booking.find()
      .populate({ path: "user", select: "name email" })
      .populate({ path: "room", select: "name" });

    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching all bookings:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============== APPROVE BOOKING ===============
const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Booking ID" });
    }
    const booking = await Booking.findById(id)
      .populate({ path: "user", select: "email name" })
      .populate({ path: "room", select: "name" });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "Booked";
    await booking.save();

    // Notify user by email with a more formal HTML template
    if (booking.user?.email) {
      try {
        const htmlMessage = `
<html>
<head>
  <meta charset="UTF-8" />
  <title>Booking Approved</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f7f7f7;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; margin-top:20px; box-shadow:0 0 10px rgba(0,0,0,0.1);">
    <tr>
      <td align="center" style="padding:20px 0; background-color:#007BFF; color:#ffffff;">
        <h1 style="margin:0;">Booking Approved</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 30px;">
        <p style="font-size:16px;">Dear ${booking.user.name},</p>
        <p style="font-size:16px;">
          We are pleased to inform you that your booking has been approved. Below are the details:
        </p>
        <ul style="font-size:16px; padding-left:1.2em;">
          <li><strong>Room:</strong> ${booking.room?.name}</li>
          <li><strong>Date:</strong> ${booking.date}</li>
          <li><strong>Time Slot:</strong> ${booking.timeSlot}</li>
        </ul>
        <p style="font-size:16px;">
          We appreciate your patronage and look forward to providing you with an excellent experience.
          If you have any questions or need further assistance, please feel free to contact our support team.
        </p>
        <p style="font-size:16px;">Thank you for choosing our services.</p>
        <p style="font-size:16px; margin-bottom:0;">
          Sincerely,<br/>
          The Team
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:10px; background-color:#f0f0f0;">
        <p style="font-size:14px; color:#666; margin:0;">&copy; TSC ROOM RESERVATION SYSTEM.</p>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
        await sendEmail(booking.user.email, "Booking Approved", htmlMessage);
      } catch (emailError) {
        console.error("⚠️ Email notification failed:", emailError.message);
      }
    }

    res.json({ message: "Booking approved successfully" });
  } catch (error) {
    console.error("❌ Error approving booking:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============== REJECT BOOKING ===============
const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Booking ID" });
    }
    const booking = await Booking.findById(id)
      .populate({ path: "user", select: "email name" })
      .populate({ path: "room", select: "name" });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "Rejected";
    await booking.save();

    // Notify user by email with a more formal HTML template
    if (booking.user?.email) {
      try {
        const htmlMessage = `
<html>
<head>
  <meta charset="UTF-8" />
  <title>Booking Rejected</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f7f7f7;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; margin-top:20px; box-shadow:0 0 10px rgba(0,0,0,0.1);">
    <tr>
      <td align="center" style="padding:20px 0; background-color:#e74c3c; color:#ffffff;">
        <h1 style="margin:0;">Booking Rejected</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 30px;">
        <p style="font-size:16px;">Dear ${booking.user.name},</p>
        <p style="font-size:16px;">
          We regret to inform you that your booking request could not be approved at this time. Below are the details:
        </p>
        <ul style="font-size:16px; padding-left:1.2em;">
          <li><strong>Room:</strong> ${booking.room?.name}</li>
          <li><strong>Date:</strong> ${booking.date}</li>
          <li><strong>Time Slot:</strong> ${booking.timeSlot}</li>
        </ul>
        <p style="font-size:16px;">
          We apologize for any inconvenience caused. If you have any questions or would like more information regarding this
          decision, please feel free to reach out to our support team.
        </p>
        <p style="font-size:16px;">Thank you for your understanding.</p>
        <p style="font-size:16px; margin-bottom:0;">
          Sincerely,<br/>
          The Team
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:10px; background-color:#f0f0f0;">
        <p style="font-size:14px; color:#666; margin:0;">&copy; TSC ROOM RESERVATION SYSTEM.</p>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
        await sendEmail(booking.user.email, "Booking Rejected", htmlMessage);
      } catch (emailError) {
        console.error("⚠️ Email notification failed:", emailError.message);
      }
    }

    res.json({ message: "Booking rejected successfully" });
  } catch (error) {
    console.error("❌ Error rejecting booking:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============== GET ALL USERS (FOR ADMIN) ===============
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("name email role phone");
    const admins = await Admin.find().select("name email role phone");
    const allUsers = [...users, ...admins];
    allUsers.sort((a, b) => a.name.localeCompare(b.name));
    res.json(allUsers);
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============== REGISTER A NEW USER OR ADMIN ===============
const createUserOrAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, isAdmin } = req.body;

    // Decide role based on isAdmin
    const role = Boolean(isAdmin) ? "admin" : "user";

    // Check if user/admin with same email exists
    const existingUser = await User.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });
    if (existingUser || existingAdmin) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser;
    if (role === "admin") {
      newUser = new Admin({
        name,
        email,
        phone,
        password: hashedPassword,
        role
      });
    } else {
      newUser = new User({
        name,
        email,
        phone,
        password: hashedPassword,
        role
      });
    }

    await newUser.save();

    // Send welcome email only for non-admin
    if (role !== "admin") {
      try {
        const htmlMessage = `
<html>
<head>
  <meta charset="UTF-8" />
  <title>Account Creation Confirmation</title>
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
          We are pleased to inform you that your account has been successfully created with the role of
          <strong>${role}</strong>. Below are the details:
        </p>
        <ul style="font-size:16px; padding-left:1.2em;">
          <li><strong>Role:</strong> ${role}</li>
          <li>
            <strong>Next Steps:</strong> Click the button below to access your system dashboard and complete your account setup.
            Detailed instructions will be provided upon your first login.
          </li>
          <li>
            <strong>Support:</strong> If you have any questions or need assistance, please contact our support team at
            <a href="mailto:support@example.com">support@example.com</a>.
          </li>
        </ul>
        <p style="text-align:center; margin:30px 0;">
          <a
            href="http://localhost:3000/pages/index.html"
            style="
              display:inline-block;
              padding:12px 24px;
              background-color:#007BFF;
              color:#ffffff;
              text-decoration:none;
              border-radius:5px;
              font-size:16px;
            "
          >
            Access System Page
          </a>
        </p>
        <p style="font-size:16px;">Thank you for choosing our services.</p>
        <p style="font-size:16px; margin-bottom:0;">
          Sincerely,<br/>
          The Team
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:10px; background-color:#f0f0f0;">
        <p style="font-size:14px; color:#666; margin:0;">&copy; TSC ROOM RESERVATION SYSTEM.</p>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        await sendEmail(email, "Account Creation Confirmation", htmlMessage);
      } catch (emailError) {
        console.error("⚠️ Email sending failed:", emailError.message);
      }
    }

    res.status(201).json({ message: `Registration successful as ${role}` });
  } catch (error) {
    console.error("❌ Error creating user/admin:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============== UPDATE USER (FOR ADMIN) ===============
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    // Destructure updated fields from request body
    const { name, email, phone, role, password } = req.body;
    const updatePayload = { name, email, phone, role };

    // If a new password is provided, hash it
    if (password) {
      updatePayload.password = await bcrypt.hash(password, 10);
    }

    // Try updating in the User collection first
    let updatedUser = await User.findByIdAndUpdate(id, updatePayload, { new: true });
    if (!updatedUser) {
      // If not found in User collection, try Admin collection
      updatedUser = await Admin.findByIdAndUpdate(id, updatePayload, { new: true });
    }

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("❌ Error updating user:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============== DELETE USER (FOR ADMIN) ===============
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    // Attempt to delete from User collection first
    let deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      // If not found in User, try the Admin collection
      deletedUser = await Admin.findByIdAndDelete(id);
    }

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting user:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============== ANNOUNCEMENTS ===============
const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error("❌ Error fetching announcements:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, message, date, sendEmailAll } = req.body;
    // Use provided date or default to current date
    const announcementDate = date ? new Date(date) : new Date();

    const announcement = new Announcement({
      title,
      message,
      date: announcementDate
    });
    await announcement.save();

    // If the flag is set, send email notifications to all users with a more formal design
    if (sendEmailAll) {
      const users = await User.find();
      // If you want to include admins, fetch them as well:
      // const admins = await Admin.find();
      // const allRecipients = [...users, ...admins];

      for (const user of users) {
        try {
          const htmlMessage = `
<html>
<head>
  <meta charset="UTF-8" />
  <title>New Announcement</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f7f7f7;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; margin-top:20px; box-shadow:0 0 10px rgba(0,0,0,0.1);">
    <tr>
      <td align="center" style="padding:20px 0; background-color:#007BFF; color:#ffffff;">
        <h1 style="margin:0;">${title}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 30px;">
        <p style="font-size:16px;">Dear ${user.name},</p>
        <p style="font-size:16px;">${message}</p>
        <p style="font-size:16px; margin-bottom:0;">
          Sincerely,<br/>
          The Team
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:10px; background-color:#f0f0f0;">
        <p style="font-size:14px; color:#666; margin:0;">&copy; TSC ROOM RESERVATION SYSTEM.</p>
      </td>
    </tr>
  </table>
</body>
</html>
          `;
          await sendEmail(
            user.email,
            `New Announcement: ${title}`,
            htmlMessage
          );
          console.log(`✅ Announcement email sent to ${user.email}`);
        } catch (err) {
          console.error(`⚠️ Failed to send announcement email to ${user.email}: ${err.message}`);
        }
      }
    }

    res.status(201).json({ message: "Announcement created successfully" });
  } catch (error) {
    console.error("❌ Error creating announcement:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Announcement ID" });
    }

    const updated = await Announcement.findByIdAndUpdate(
      id,
      { title, message, date },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement updated successfully" });
  } catch (error) {
    console.error("❌ Error updating announcement:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Announcement ID" });
    }

    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting announcement:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Export everything
module.exports = {
  // Bookings & Dashboard
  getAdminDashboard,
  getAllBookings,
  approveBooking,
  rejectBooking,

  // Users
  getAllUsers,
  createUserOrAdmin,
  updateUser,
  deleteUser,

  // Announcements
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
