const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    let token = req.header("Authorization");

    if (!token) {
        console.log("❌ No token provided");
        return res.status(401).json({ message: "Unauthorized! No token provided." });
    }

    try {
        token = token.replace("Bearer ", "").trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log("✅ Decoded User:", decoded); // Debugging log to check token is recognized or not
        
        req.user = decoded; 
        next();
    } catch (error) {
        console.error("❌ Invalid Token:", error.message);
        return res.status(401).json({ message: "Invalid Token!" });
    }
};

module.exports = authMiddleware;
