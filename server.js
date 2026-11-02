import express from "express";
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
import notificationRoutes from "./routes/notificationRoutes.js";
// Security + DB
import { connectDB } from "./config/db.js";
import { securityHeaders, sanitizeInput, rateLimit } from "./middleware/security.js";

dotenv.config();
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); // Vercel proxy ke peeche asli client IP ke liye

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set — login will not work until you set it.");
} else if (process.env.JWT_SECRET.length < 32) {
  console.warn("⚠️ JWT_SECRET is short. Use a random 64+ character secret.");
}

/* ================= SECURITY HEADERS ================= */
app.use(securityHeaders);

/* ================= CORS ================= */
// Extra origins Vercel env mein ALLOWED_ORIGINS=https://a.vercel.app,https://b.com se add karo
const isProd = process.env.NODE_ENV === "production";
const allowedOrigins = new Set([
  "https://engro-ems-frontend.vercel.app",
  ...(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
]);
// Localhost sirf development mein (ya ALLOW_LOCALHOST=true set ho to production mein bhi)
if (!isProd || process.env.ALLOW_LOCALHOST === "true") {
  allowedOrigins.add("http://localhost:5173");
  allowedOrigins.add("http://localhost:3000");
}

const corsOptions = {
  origin: (origin, callback) => {
    // Origin header nahi (Postman/server-to-server) ya allowed list mein -> theek
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false); // CORS headers nahi milenge -> browser block karega
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // preflight 24 ghante cache -> kam extra requests
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// Preflight (OPTIONS) kabhi DB tak nahi jayegi — allowed ya na-allowed dono par foran jawab
app.use((req, res, next) => (req.method === "OPTIONS" ? res.sendStatus(204) : next()));

/* ================= BODY ================= */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

/* ================= INPUT SANITIZE + RATE LIMIT ================= */
app.use(sanitizeInput);

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1500 });
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many login attempts from this network. Please try again in a few minutes.",
});
app.use("/api", apiLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/admin/login", loginLimiter);

/* ================= HEALTH (DB ki zaroorat nahi) ================= */
app.get("/api/health", (req, res) => res.json({ ok: true }));

/* ================= DB (har request se pehle connection ka intezar) ================= */
// Pehle connect() bina await ke chalta tha -> cold start par requests hang/fail hoti thi.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    res.status(503).json({
      msg: "Service temporarily unavailable. Please try again.",
      message: "Service temporarily unavailable. Please try again.",
    });
  }
});

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
app.use("/api/notifications", notificationRoutes);

/* ================= 404 + ERROR HANDLER ================= */
app.use((req, res) => res.status(404).json({ message: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ message: "Request too large" });
  }
  console.error("Unhandled error:", err?.message);
  res.status(500).json({ message: "Server error" }); // stack/details client ko nahi
});

/* ================= LOCAL SERVER ================= */
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}

/* ================= EXPORT ================= */
export default app;
