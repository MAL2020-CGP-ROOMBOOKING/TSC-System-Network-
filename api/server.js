const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const os = require("os");
const fs = require("fs");
const https = require("https");




// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();


// Load SSL cert and key
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "./cert/server.key")),
  cert: fs.readFileSync(path.join(__dirname, "./cert/server.crt")),
};


// Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(cors({ origin: "*" })); // Allow access from any origin

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "*"], // Allow all network requests
      },
    },
  })
);

// Function to get local IP address dynamically
function getLocalIP() {
  const networkInterfaces = os.networkInterfaces();
  for (const key in networkInterfaces) {
    for (const net of networkInterfaces[key]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    // Import Routes
    const authRoutes = require("./routes/authRoutes");
    const userRoutes = require("./routes/userRoutes");
    const adminRoutes = require("./routes/adminRoutes");
    const bookingRoutes = require("./routes/bookingRoutes");
    const roomRoutes = require("./routes/roomRoutes");
    const announcementRoutes = require("./routes/announcementRoutes");
    const feedbackRoutes = require("./routes/feedbackRoutes");

    // Use API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/booking", bookingRoutes);
    app.use("/api/rooms", roomRoutes);
    app.use("/api/announcements", announcementRoutes);
    app.use("/api/feedback", feedbackRoutes);

    // Serve static files from frontend directory
    app.use(express.static(path.join(__dirname, "../frontend/pages")));
    app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")));
    app.use("/css", express.static(path.join(__dirname, "../frontend/css")));
    app.use("/scripts", express.static(path.join(__dirname, "../frontend/scripts")));
    app.use("/pages", express.static(path.join(__dirname, "../frontend/pages")));
    


    // Serve main frontend page
    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend/pages", "index.html"));
    });

    // 404 handler for unmatched API routes
    app.use("/api/*", (req, res) => {
      res.status(404).json({ message: "API route not found" });
    });

    // Global Error Handling Middleware
    app.use((err, req, res, next) => {
      console.error("❌ Global Error:", err.message);
      res.status(500).json({ message: "Internal Server Error" });
    });

    // Final catch-all for any other requests → 404
    app.use((req, res, next) => {
      console.log(`🛑 Route Not Found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ message: "Not Found" });
    });

    // Start Server on Network
    const PORT = process.env.PORT || 3000;
    const HOST = "0.0.0.0"; // Allows access from all devices on the network
    const LOCAL_IP = getLocalIP(); // Get dynamic local network IP

    
  const BASE_URL = `https://${LOCAL_IP}:${PORT}`;
  const ENV_FILE_PATH = path.join(__dirname, "../frontend/scripts/env.js");
  
  fs.writeFileSync(
    ENV_FILE_PATH,
    `window.ENV = { BASE_URL: "${BASE_URL}" };`,
    "utf8"
  );
    // Start HTTPS Server
https.createServer(sslOptions, app).listen(PORT, HOST, () => {
  console.log(`🔐 HTTPS Server running on:
  - Localhost: https://localhost:${PORT}
  - Network:   https://${LOCAL_IP}:${PORT}`);
});

  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });


