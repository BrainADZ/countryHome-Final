import { Schema, model } from "mongoose";
/* -------------------- Cart Item Schema -------------------- */
const CartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
    },
    // OPTIONAL
    variantId: {
        type: Schema.Types.ObjectId,
        default: null,
        index: true,
        // ref: "Variant", // optional: only if you have a Variant collection
    },
    colorKey: {
        type: String,
        default: null,
        trim: true,
        lowercase: true,
    },
    qty: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
    // snapshots
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    mrp: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
    addedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { _id: true });
/* -------------------- Cart Schema -------------------- */
const CartSchema = new Schema({
    ownerKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    guestId: {
        type: String,
        default: null,
        trim: true,
    },
    items: { type: [CartItemSchema], default: [] },
}, { timestamps: true });
/* -------------------- Hooks -------------------- */
CartSchema.pre("save", function (next) {
    try {
        const cart = this;
        const now = new Date();
        if (Array.isArray(cart.items)) {
            cart.items.forEach((it) => {
                // ensure dates
                if (!it.addedAt)
                    it.addedAt = now;
                it.updatedAt = now;
                // normalize colorKey
                if (typeof it.colorKey === "string") {
                    const ck = it.colorKey.trim().toLowerCase();
                    it.colorKey = ck.length ? ck : null;
                }
                // normalize title/image (avoid accidental blanks)
                if (typeof it.title === "string")
                    it.title = it.title.trim();
                if (typeof it.image === "string")
                    it.image = it.image.trim();
            });
        }
        next();
    }
    catch (e) {
        next(e);
    }
});
export const Cart = model("Cart", CartSchema);
