const jwt = require("jsonwebtoken");


const adminMiddleware = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ message: "Unauthorized! No token provided." });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);

        console.log("Decoded Token:", decoded); // Debugging log

        // Ensure role check is case-insensitive
        if (!decoded.role || decoded.role.toLowerCase() !== "admin") {
            return res.status(403).json({ message: "Access Denied! Admins only." });
        }

        req.admin = decoded; // Attach admin data to request object
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message); // Debugging log
        res.status(401).json({ message: "Invalid Token!" });
    }
};

module.exports = adminMiddleware;
