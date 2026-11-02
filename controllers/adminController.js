import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import {
  fakePasswordCheck,
  isLocked,
  lockMinutesLeft,
  recordFailedLogin,
  clearFailedLogins,
  signToken,
  jwtConfigured,
} from "../utils/authHelpers.js";
import { isEmail, isStrongPassword, PASSWORD_RULE_MSG } from "../middleware/security.js";

const fail = (res, status, text) => res.status(status).json({ msg: text, message: text });

// 🔹 Add new Admin  (route par auth + admin-only laga hai)
export const addAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (typeof name !== "string" || !name.trim() || name.length > 100) {
      return fail(res, 400, "Valid name is required");
    }
    if (!isEmail(email)) return fail(res, 400, "Valid email is required");
    if (!isStrongPassword(password)) return fail(res, 400, PASSWORD_RULE_MSG);

    const cleanEmail = email.trim().toLowerCase();

    const existingAdmin = await Admin.findOne({ email: cleanEmail });
    if (existingAdmin) return fail(res, 400, "Admin already exists");

    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = await Admin.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    // Password hash kabhi response mein nahi
    res.status(201).json({
      message: "Admin created successfully",
      admin: { _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email },
    });
  } catch (err) {
    console.error("addAdmin error:", err.message);
    return fail(res, 500, "Server error");
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

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

    // Pehle yahan "secretkey" ka fallback tha — ab nahi. Secret na ho to login band.
    if (!jwtConfigured()) {
      console.error("JWT_SECRET is not configured");
      return fail(res, 500, "Server misconfigured");
    }

    const cleanEmail = email.trim();

    let admin = await Admin.findOne({ email: cleanEmail }).select("+password");
    if (!admin && cleanEmail !== cleanEmail.toLowerCase()) {
      admin = await Admin.findOne({ email: cleanEmail.toLowerCase() }).select("+password");
    }

    if (!admin) {
      await fakePasswordCheck(password);
      return fail(res, 400, "Invalid credentials");
    }

    if (isLocked(admin)) {
      return fail(
        res,
        429,
        `Too many failed attempts. Try again in ${lockMinutesLeft(admin)} minute(s).`
      );
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      await recordFailedLogin(Admin, admin);
      return fail(res, 400, "Invalid credentials");
    }

    await clearFailedLogins(Admin, admin);

    const token = signToken({ id: admin._id, role: "Admin" });

    res.json({
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err.message);
    return fail(res, 500, "Server error");
  }
};
