const express = require("express");
const {
  getRoomSchedule,
  bookRoom,
  getUserBookings,
  cancelBooking,
  updateBooking
} = require("../controllers/bookingController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/schedule", authMiddleware, getRoomSchedule);
router.post("/book", authMiddleware, bookRoom);
router.get("/userBookings", authMiddleware, getUserBookings);
router.post("/cancel", authMiddleware, cancelBooking);
router.post("/update", authMiddleware, updateBooking);

module.exports = router;
