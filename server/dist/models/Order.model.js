import mongoose, { Schema } from "mongoose";
const orderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    totalAmount: Number,
    paymentStatus: String,
}, { timestamps: true });
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
