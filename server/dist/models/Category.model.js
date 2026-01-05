import { Schema, model } from "mongoose";
const CategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },
    // ✅ Category Image (for home, listing, mega menu)
    image: {
        type: String,
        default: "",
    },
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
    },
}, {
    timestamps: true,
});
export const Category = model("Category", CategorySchema);
