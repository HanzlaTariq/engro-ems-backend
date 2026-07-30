import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
// Routes
import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import safetyTalkRoutes from "./routes/safetyTalk.js";
import safetyTalkTruckerRoutes from "./routes/safetyTalkTrucker.js";
import userRoutes from "./routes/userRoutes.js";
import warehouseRoutes from "./routes/warehouses.js";
import adminRoutes from "./routes/adminRoutes.js";
import WeeklySpotCheckRoutes from "./routes/weeklySpotCheckRoutes.js";
import QuarterlySpotCheckRoutes from "./routes/quarterlySpotCheckRoutes.js";
import emptyBagRoutes from "./routes/emptyBagRecordRoutes.js";
import preNumberStationaryRecordRoutes from "./routes/preNumberStationaryRecordRoutes.js";
import dashboardStatsRoutes from "./routes/dashboardStatsRoutes.js";
dotenv.config();
const app = express();
/* ================= CORS ================= */
const allowedOrigins = [
  "https://engro-ems-frontend.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());
/* ================= BODY ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/safety-talk", safetyTalkRoutes);
app.use("/api/users", userRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/spot-check", WeeklySpotCheckRoutes);
app.use("/api/quarterly-spot-check", QuarterlySpotCheckRoutes);
app.use("/api/empty-bag-record", emptyBagRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/safety-talk-trucker", safetyTalkTruckerRoutes);
app.use("/api/pre-number-stationary-record", preNumberStationaryRecordRoutes);
app.use("/api/dashboard-stats", dashboardStatsRoutes);
/* ================= DB ================= */
// MongoDB connection with caching for Vercel
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
  console.log("MongoDB connected");
};

connectDB().catch(err => console.error("MongoDB error:", err));
/* ================= LOCAL SERVER ================= */
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}
/* ================= EXPORT ================= */
export default app;