const mongoose = require("mongoose");
require("dotenv").config(); // Ensure .env file is loaded

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("🚨 MONGO_URI is missing in .env file!");
        }

        console.log(`🔄 Attempting to connect to: ${process.env.MONGO_URI}`);

        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ Connected to MongoDB: ${mongoose.connection.host}`);
        console.log(`✅ Using Database: ${mongoose.connection.name}`);
    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err);
        process.exit(1);
    }
};

module.exports = connectDB;
