import User from "../models/User.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

export const auth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ msg: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;
    const role = decoded.role?.toLowerCase();

    if (!userId) return res.status(401).json({ msg: "Invalid token payload – no user ID" });

    req.userId = userId;

    // ✅ Fetch role info based on model
    let userData;
    if (role === "admin") {
      userData = await Admin.findById(userId).select("name email role");
    } else {
      userData = await User.findById(userId).select("name email role warehouse warehouses");
    }

    if (userData) {
      req.user = {
        id: userId,
        email: userData.email,
        role: role,
        name: userData.name,
        
      };
    }

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ msg: "Invalid token" });
  }
};

export default auth;
