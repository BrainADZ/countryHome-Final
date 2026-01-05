import mongoose, { Schema } from "mongoose";
const vendorSchema = new Schema({
    shopName: String,
    email: String,
    password: String,
}, { timestamps: true });
const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
export default Vendor;
