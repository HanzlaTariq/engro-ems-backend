// scripts/createAdmin.js
// Naya admin banane ka SAFE tareeqa (apne computer par chalao, internet endpoint nahi).
//
// Use (Windows PowerShell):
//   $env:ADMIN_PASSWORD="StrongPass123"; node scripts/createAdmin.js "Admin Name" admin@example.com
// Use (Mac/Linux):
//   ADMIN_PASSWORD="StrongPass123" node scripts/createAdmin.js "Admin Name" admin@example.com
//
// .env file mein MONGO_URI hona chahiye.
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import { isEmail, isStrongPassword, PASSWORD_RULE_MSG } from "../middleware/security.js";

dotenv.config();

const [, , name, email] = process.argv;
const password = process.env.ADMIN_PASSWORD;

const exit = (msg, code = 1) => {
  console.log(msg);
  process.exit(code);
};

if (!process.env.MONGO_URI) exit("❌ MONGO_URI .env mein nahi mila");
if (!name || !isEmail(email)) exit('❌ Use: node scripts/createAdmin.js "Name" email@example.com');
if (!isStrongPassword(password)) exit(`❌ ADMIN_PASSWORD env set karo. ${PASSWORD_RULE_MSG}`);

try {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });

  const cleanEmail = email.trim().toLowerCase();
  const exists = await Admin.findOne({ email: cleanEmail });
  if (exists) exit("❌ Is email ka admin pehle se maujood hai");

  await Admin.create({
    name: name.trim(),
    email: cleanEmail,
    password: await bcrypt.hash(password, 12),
  });

  console.log(`✅ Admin ban gaya: ${cleanEmail}`);
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  exit(`❌ Error: ${err.message}`);
}
