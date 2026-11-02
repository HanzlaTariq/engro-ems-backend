import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  // select:false -> query mein password hash kabhi ghalti se response mein nahi jayega
  password: { type: String, required: true, select: false },
  // Login brute-force protection (DB based, Vercel par bhi kaam karta hai)
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
});

export default mongoose.model("Admin", AdminSchema);
