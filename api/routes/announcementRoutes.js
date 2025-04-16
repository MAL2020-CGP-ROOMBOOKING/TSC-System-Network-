// routes/announcementRoutes.js
const express = require("express");
const {
  getAllAnnouncements,
} = require("../controllers/adminController"); // or a dedicated announcementController

const router = express.Router();

// Public route (no auth) to get announcements
router.get("/", getAllAnnouncements);

module.exports = router;
