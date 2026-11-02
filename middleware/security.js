// middleware/security.js
// Koi extra npm package nahi chahiye — sab built-in hai.

/* ---------- 1) Security headers (helmet jaisa) ---------- */
export const securityHeaders = (req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Cache-Control", "no-store"); // private data kisi cache mein nahi jayega
  next();
};

/* ---------- 2) NoSQL injection / prototype pollution cleaner ---------- */
const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const clean = (obj, depth = 0) => {
  if (!obj || typeof obj !== "object" || depth > 12) return;
  if (Array.isArray(obj)) {
    obj.forEach((v) => clean(v, depth + 1));
    return;
  }
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".") || BAD_KEYS.has(key)) {
      delete obj[key];
    } else {
      clean(obj[key], depth + 1);
    }
  }
};

export const sanitizeInput = (req, res, next) => {
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
};

/* ---------- 3) Chhota in-memory rate limiter ---------- */
// NOTE: Vercel par har instance ka apna memory hota hai, isliye ye "extra layer" hai.
// Asli account protection login lockout (DB based) se hoti hai.
export const rateLimit = ({ windowMs, max, message }) => {
  const hits = new Map();
  const text = message || "Too many requests. Please try again later.";

  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();

    // purani entries saaf (bahut bada hone se bachane ke liye)
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    }

    let entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ msg: text, message: text });
    }
    next();
  };
};

/* ---------- 4) ObjectId validator (:id wale routes ke liye) ---------- */
const OBJECT_ID = /^[a-fA-F0-9]{24}$/;
export const validateObjectIdParam = (req, res, next, value) => {
  if (!OBJECT_ID.test(String(value))) {
    return res.status(400).json({ message: "Invalid id" });
  }
  next();
};

/* ---------- 5) Input helpers ---------- */
export const isStrongPassword = (pw) =>
  typeof pw === "string" &&
  pw.length >= 8 &&
  pw.length <= 72 && // bcrypt 72 bytes se aage ignore karta hai
  /[A-Za-z]/.test(pw) &&
  /\d/.test(pw);

export const PASSWORD_RULE_MSG =
  "Password must be 8-72 characters and contain at least one letter and one number";

export const isEmail = (v) =>
  typeof v === "string" && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
