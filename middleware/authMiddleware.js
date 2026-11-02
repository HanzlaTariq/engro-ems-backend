import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

export const auth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const [scheme, token] = typeof authHeader === "string" ? authHeader.split(" ") : [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ msg: "No token provided", message: "No token provided" });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({ msg: "Server misconfigured", message: "Server misconfigured" });
  }

  // 1) Token verify — sirf yahan fail ho to 401 (user ko logout karna theek hai)
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token", message: "Invalid or expired token" });
  }

  const userId = decoded.id || decoded._id;
  const tokenRole = String(decoded.role || "").toLowerCase();

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ msg: "Invalid token payload", message: "Invalid token payload" });
  }

  // 2) Database lookup — yahan error aaye to 503 (401 nahi!), warna DB ki temporary
  //    problem par user bar bar logout ho jata tha.
  try {
    let account;
    let role;

    if (tokenRole === "admin") {
      account = await Admin.findById(userId).select("name email");
      role = "admin";
    } else {
      account = await User.findById(userId).select("name email role status");
      role = String(account?.role || "").toLowerCase();

      // Inactive / disabled user ka purana token bhi kaam nahi karega
      if (account && account.status !== "active") {
        return res.status(401).json({ msg: "Account is not active", message: "Account is not active" });
      }
    }

    // Account delete ho chuka ho to access band
    if (!account) {
      return res.status(401).json({ msg: "Account no longer exists", message: "Account no longer exists" });
    }

    req.userId = String(userId);
    req.user = {
      id: String(userId),
      email: account.email,
      role,
      name: account.name,
    };

    return next();
  } catch (err) {
    console.error("Auth DB error:", err.message);
    return res.status(503).json({
      msg: "Service temporarily unavailable. Please try again.",
      message: "Service temporarily unavailable. Please try again.",
    });
  }
};

export default auth;
