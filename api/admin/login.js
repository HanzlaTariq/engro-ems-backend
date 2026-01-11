import { loginAdmin } from "../../../controllers/adminController.js"; // path adjust karo

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await loginAdmin(req, res); // existing controller use karo
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
