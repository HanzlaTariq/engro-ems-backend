import Warehouse from "../models/Warehouse.js";

// Sirf ye fields client se allow hain. createdBy / incharge / _id kabhi nahi.
const ALLOWED_FIELDS = [
  "name",
  "location",
  "province",
  "city",
  "address",
  "capacity",
  "contactPerson",
  "contactPhone",
  "status",
];

const pickAllowed = (body = {}) => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) {
      // Sirf string/number allow (object nahi) + length limit
      if (typeof body[key] === "string") data[key] = body[key].trim().slice(0, 300);
      else if (typeof body[key] === "number") data[key] = String(body[key]);
    }
  }
  return data;
};

const handleError = (res, err, tag) => {
  if (err?.name === "ValidationError") return res.status(400).json({ message: err.message });
  if (err?.name === "CastError") return res.status(400).json({ message: "Invalid data" });
  console.error(`${tag} error:`, err?.message);
  return res.status(500).json({ message: "Server error" });
};

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ createdBy: req.userId });
    res.json(warehouses);
  } catch (err) {
    handleError(res, err, "getWarehouses");
  }
};

export const addWarehouse = async (req, res) => {
  try {
    const data = { ...pickAllowed(req.body), createdBy: req.userId };
    const warehouse = await Warehouse.create(data);
    res.status(201).json(warehouse);
  } catch (err) {
    handleError(res, err, "addWarehouse");
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      pickAllowed(req.body), // createdBy badalna ab possible nahi
      { new: true, runValidators: true }
    );

    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });

    res.json(warehouse);
  } catch (err) {
    handleError(res, err, "updateWarehouse");
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });

    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    handleError(res, err, "deleteWarehouse");
  }
};

export const getWarehouseById = async (req, res) => {
  try {
    // Pehle koi bhi kisi bhi warehouse ki detail dekh sakta tha — ab sirf apni
    const warehouse = await Warehouse.findOne({ _id: req.params.id, createdBy: req.userId });

    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.json(warehouse);
  } catch (err) {
    handleError(res, err, "getWarehouseById");
  }
};
