import mongoose from "mongoose";

const weeklySpotCheckSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  stocks: [{
    item: { type: String, required: true },
    sitQty: { type: Number, required: true },
    physicalCount: { type: Number, required: true },
    looseProduct: { type: Number, required: true },
    remarks: String
  }],
  elcb: {
    weekly: {
      month: String,
      whi: String,
      electrician: String,
      comment: String
    },
    quarterly: {
      month: String,
      whi: String,
      electrician: String,
      comment: String
    }
  },
  earthingHealth: {
    month: String,
    ohm: String,
    electrician: String,
    stamp: String,
    comment: String
  },
  stitchingMachine: {
    condition: String,
    conditionRemark: String,
    cord: String,
    cordRemark: String,
    oil: String,
    oilRemark: String
  },
  weighingScale: {
    condition: String,
    remarks: String
  },
  upsBattery: {
    charging: String,
    chargingRemarks: String,
    condition: String,
    conditionRemarks: String
  },
  warehouseAgreement: {
    permanentSqft: String,
    temporarySqft: String,
    remarksSqft: String,
    permanentExpiry: Date,
    temporaryExpiry: Date,
    remarksExpiry: String
  },
  govtCertificate: {
    weighingScale: {
      from: Date,
      to: Date,
      reminderDate: Date
    },
    warehouseReg: {
      from: Date,
      to: Date,
      reminderDate: Date
    }
  },
  fireExtinguishers: [{
    lastRefill: Date,
    expiry: Date,
    pressure: String,
    nozzle: String,
    seal: String
  }],
  safetyRamp: [{
    frequently: String,
    status: String,
    remarks: String
  }],
  srlHarness: [{
    status: String,
    remarks: String,
    freq: String
  }],
  emergencyNumbers: {
    fireBrigade: String,
    rescue: String,
    civilDefense: String,
    bombDisposal: String,
    nearestHospital: String,
    policeStation: String,
    districtHospital: String,
    edhi: String
  },
  medicine: String,
  warehouseIncharge: String,
  verifiedBy: String,
  remarks: String,
  doEmail: { type: String },

  createdBy: {  // ✅ User ID for isolation
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  warehouse: {  // ✅ Auto-set warehouse
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true
  }
}, { timestamps: true });

export default mongoose.model("WeeklySpotCheck", weeklySpotCheckSchema);