// utils/authHelpers.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minute

// Jab email exist hi na kare tab bhi bcrypt chalao, taake response time se
// pata na chale ke email system mein hai ya nahi (user enumeration roknay ke liye).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password-for-timing", 10);
export const fakePasswordCheck = (password) => bcrypt.compare(password, DUMMY_HASH);

export const isLocked = (doc) => !!(doc.lockUntil && doc.lockUntil.getTime() > Date.now());

export const lockMinutesLeft = (doc) =>
  Math.max(1, Math.ceil((doc.lockUntil.getTime() - Date.now()) / 60000));

// Galat password par attempt count barhao; limit par account 15 min ke liye lock
export const recordFailedLogin = async (Model, doc) => {
  // Purana lock expire ho chuka ho to count dobara 1 se shuru
  if (doc.lockUntil && doc.lockUntil.getTime() <= Date.now()) {
    await Model.updateOne({ _id: doc._id }, { $set: { loginAttempts: 1, lockUntil: null } });
    return;
  }

  const updated = await Model.findByIdAndUpdate(
    doc._id,
    { $inc: { loginAttempts: 1 } },
    { new: true }
  ).select("loginAttempts");

  if (updated && updated.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    await Model.updateOne(
      { _id: doc._id },
      { $set: { lockUntil: new Date(Date.now() + LOCK_TIME_MS), loginAttempts: 0 } }
    );
  }
};

export const clearFailedLogins = async (Model, doc) => {
  if (doc.loginAttempts || doc.lockUntil) {
    await Model.updateOne({ _id: doc._id }, { $set: { loginAttempts: 0, lockUntil: null } });
  }
};

// Token: HS256, default 12 ghante (env JWT_EXPIRES_IN se badal sakte hain)
export const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });

export const jwtConfigured = () => !!process.env.JWT_SECRET;
