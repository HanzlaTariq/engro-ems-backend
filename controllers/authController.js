// controllers/authController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  fakePasswordCheck,
  isLocked,
  lockMinutesLeft,
  recordFailedLogin,
  clearFailedLogins,
  signToken,
  jwtConfigured,
} from "../utils/authHelpers.js";

// NOTE: Public "register" endpoint hata diya gaya hai — koi bhi bahar se account
// bana sakta tha. Users ab sirf Admin panel (/api/users/add) se banenge.

const fail = (res, status, text) => res.status(status).json({ msg: text, message: text });

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Sirf string allow — object bhejkar NoSQL injection nahi chalegi
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password ||
      email.length > 254 ||
      password.length > 200
    ) {
      return fail(res, 400, "Email and password are required");
    }

    if (!jwtConfigured()) {
      console.error("JWT_SECRET is not configured");
      return fail(res, 500, "Server misconfigured");
    }

    const cleanEmail = email.trim();

    // Pehle exact match (purane mixed-case emails ke liye), phir lowercase
    let user = await User.findOne({ email: cleanEmail }).select("+password");
    if (!user && cleanEmail !== cleanEmail.toLowerCase()) {
      user = await User.findOne({ email: cleanEmail.toLowerCase() }).select("+password");
    }

    if (!user) {
      await fakePasswordCheck(password); // timing same rakho
      return fail(res, 400, "Invalid email or password");
    }

    if (isLocked(user)) {
      return fail(
        res,
        429,
        `Too many failed attempts. Try again in ${lockMinutesLeft(user)} minute(s).`
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await recordFailedLogin(User, user);
      return fail(res, 400, "Invalid email or password");
    }

    // Status check (password sahi hone ke baad)
    if (user.status !== "active") {
      return fail(res, 403, "User account is not active. Please contact admin.");
    }

    await clearFailedLogins(User, user);

    const token = signToken({ id: user._id, role: user.role });

    await user.populate("warehouse");

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        warehouse: user.warehouse,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return fail(res, 500, "Server error");
  }
};
