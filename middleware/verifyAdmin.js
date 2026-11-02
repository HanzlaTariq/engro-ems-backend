// Sirf Admin allow hai. (Pehle warehouse_manager bhi pass ho jata tha — ab nahi.)
export const verifyAdmin = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();

  if (role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};

export default verifyAdmin;
