import Warehouse from "../models/Warehouse.js";




export const getWarehouses = async (req, res) => {
  try {
    console.log('🔍 GET Warehouses - User ID from middleware:', req.userId);  // Ye print hoga console mein
    if (!req.userId) {
      console.log('❌ No userId! Middleware not working.');
      return res.status(401).json({ message: "Unauthorized - No user ID" });
    }
    
    const warehouses = await Warehouse.find({ createdBy: req.userId });
    console.log('📊 Found warehouses for this admin:', warehouses.length);  // Kitne mile
    
    res.json(warehouses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const addWarehouse = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.userId };  // ✅ req.userId – ye fix karega validation
    const warehouse = await Warehouse.create(data);
    res.status(201).json(warehouse);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },  // ✅ req.userId
      req.body,
      { new: true }
    );

    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });

    res.json(warehouse);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });  // ✅ req.userId

    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};








export const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.json(warehouse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
