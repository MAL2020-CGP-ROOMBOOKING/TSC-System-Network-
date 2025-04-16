const express = require("express");
const { getRooms, addRoom, updateRoomStatus, deleteRoom } = require("../controllers/roomController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// ✅ Fetch all rooms (Accessible by both Users & Admins)
router.get("/", authMiddleware, getRooms);

// ✅ Add new room (Admin Only)
// POSTing to the base path creates a new room
router.post("/", authMiddleware, adminMiddleware, addRoom);

// ✅ Update room status (Admin Only)
// PUT request to /:id updates the specified room
router.put("/:id", authMiddleware, adminMiddleware, updateRoomStatus);

// ✅ Delete a room (Admin Only)
// DELETE request to /:id removes the specified room
router.delete("/:id", authMiddleware, adminMiddleware, deleteRoom);

module.exports = router;
