const express = require("express");
const {
  getAdminDashboard,
  getAllBookings,
  approveBooking,
  rejectBooking,
  getAllUsers,
  createUserOrAdmin,
  updateUser, // <-- Added updateUser function from adminController
  deleteUser,
  // Announcement methods from your adminController
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require("../controllers/adminController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// Admin Dashboard
router.get("/dashboard", authMiddleware, adminMiddleware, getAdminDashboard);

// Bookings
router.get("/bookings", authMiddleware, adminMiddleware, getAllBookings);
router.put("/approve/:id", authMiddleware, adminMiddleware, approveBooking);
router.put("/reject/:id", authMiddleware, adminMiddleware, rejectBooking);

// Users
router.get("/users", authMiddleware, adminMiddleware, getAllUsers);
router.post("/users", authMiddleware, adminMiddleware, createUserOrAdmin);
router.put("/users/:id", authMiddleware, adminMiddleware, updateUser); // <-- New PUT route for editing a user
router.delete("/users/:id", authMiddleware, adminMiddleware, deleteUser);

// Announcements
router.get("/announcements", authMiddleware, adminMiddleware, getAllAnnouncements);
router.post("/announcements", authMiddleware, adminMiddleware, createAnnouncement);
router.put("/announcements/:id", authMiddleware, adminMiddleware, updateAnnouncement);
router.delete("/announcements/:id", authMiddleware, adminMiddleware, deleteAnnouncement);

// Handle invalid admin routes
router.use((req, res) => {
  res.status(404).json({ message: "Admin API route not found" });
});

module.exports = router;
