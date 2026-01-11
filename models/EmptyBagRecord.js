import mongoose from 'mongoose';

const emptyBagRecordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  product: { type: String, required: true },
  openingBalance: { type: Number, required: true },
  receiptQty: { type: Number, required: true },
  issuedQty: { type: Number, required: true },
  issuencePurpose: { type: String, required: true },
  perRef: { type: String, required: true },
  balanceQty: { type: Number, required: true },
  whiInitial: { type: String, required: true },
  doVerified: { type: String, default: 'DO Not Verified' },
  doEmail: { type: String },
 createdBy: {  // User ID for isolation
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
    warehouse: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: 'Warehouse', // Or if warehouse is separate model, ref: 'Warehouse'
    required: true 
  },
   createdBy: {  // User ID for isolation
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  } // Add this: Links to the creating user's warehouse
}, { timestamps: true });

export default mongoose.model('EmptyBagRecord', emptyBagRecordSchema);