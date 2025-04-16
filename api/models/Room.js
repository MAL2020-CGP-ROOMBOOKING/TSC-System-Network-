const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    status: { type: String, default: "Available", enum: ["Available", "Maintenance"] },
}, { timestamps: true });

module.exports = mongoose.model("Room", RoomSchema);
