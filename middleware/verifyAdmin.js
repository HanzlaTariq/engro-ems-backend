export const verifyAdmin = (req, res, next) => {
  try {
    const role = req.user?.role?.toLowerCase();

    // Allow Admin + Warehouse Manager (if you want only Admin, remove 2nd condition)
    if (role !== "admin" && role !== "warehouse_manager") {
      return res.status(403).json({ message: "Admin access only" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Admin middleware error" });
  }
};

export default verifyAdmin;