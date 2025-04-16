const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin", enum: ["admin"] } 
}, { timestamps: true });

module.exports = mongoose.model("Admin", AdminSchema, "admins"); // Store in "admins" collection
