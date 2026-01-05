import { Schema, model } from "mongoose";
const BannerSchema = new Schema({
    key: { type: String, required: true, unique: true, trim: true },
    image: { type: String, required: true, trim: true },
    ctaUrl: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
export const Banner = model("Banner", BannerSchema);
