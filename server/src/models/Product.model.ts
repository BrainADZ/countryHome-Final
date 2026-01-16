import { Schema, model, Document, Types } from "mongoose";

// -------------------- COLORS (Product level) --------------------
export interface IProductColor {
  _id?: Types.ObjectId;
  name: string;
  hex?: string;
  images: string[];
  orderIndex: number;
}

export interface IProductVariant {
  _id?: Types.ObjectId;

  label?: string;
  weight?: string;
  size?: string;
  comboText?: string;

  // backward compatibility only
  color?: string;

  quantity: number;
  mrp: number;
  salePrice: number;

  images: string[];
}

export interface IProduct extends Document {
  productId: string; // ✅ manual SKU now

  title: string;
  slug: string;
  description?: string;
  features?: string;

  featureImage?: string;
  galleryImages: string[];

  colors: IProductColor[];

  mrp: number;
  salePrice: number;

  baseStock: number;
  totalStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;

  variants: IProductVariant[];

  category: Types.ObjectId;
  subCategory?: Types.ObjectId | null;

  isActive: boolean;
  createdBy?: Types.ObjectId | null;
}

// -------------------- SCHEMAS --------------------
const ColorSchema = new Schema<IProductColor>(
  {
    name: { type: String, required: true, trim: true },
    hex: { type: String, default: "" },
    images: { type: [String], default: [] },
    orderIndex: { type: Number, default: 0 },
  },
  { _id: true }
);

const VariantSchema = new Schema<IProductVariant>(
  {
    label: { type: String },
    weight: { type: String },
    size: { type: String },
    comboText: { type: String },

    // backward compatibility
    color: { type: String },

    quantity: { type: Number, required: true, default: 0 },
    mrp: { type: Number, required: true },
    salePrice: { type: Number, required: true },

    images: { type: [String], default: [] },
  },
  { _id: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      // OPTIONAL: SKU ko consistent rakhna ho to uncomment:
      // uppercase: true,
    },

    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },

    description: { type: String },
    features: { type: String, default: "" },

    featureImage: { type: String },
    galleryImages: { type: [String], default: [] },

    colors: { type: [ColorSchema], default: [] },

    mrp: { type: Number, required: true },
    salePrice: { type: Number, required: true },

    baseStock: { type: Number, default: 0 },
    totalStock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    isLowStock: { type: Boolean, default: false },

    variants: { type: [VariantSchema], default: [] },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    isActive: { type: Boolean, default: true },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * totalStock = variants sum (if variants exist) else baseStock
 * isLowStock = totalStock <= lowStockThreshold
 */
const computeStock = (doc: IProduct) => {
  const variantsArr = Array.isArray(doc.variants) ? doc.variants : [];
  const hasVariants = variantsArr.length > 0;

  if (hasVariants) {
    doc.baseStock = 0;
    doc.totalStock = variantsArr.reduce(
      (sum, v) => sum + Number(v.quantity || 0),
      0
    );
  } else {
    doc.totalStock = Number(doc.baseStock || 0);
  }

  const threshold = Number(doc.lowStockThreshold ?? 5);
  doc.isLowStock = doc.totalStock <= threshold;
};

// ✅ Manual SKU validation + stock compute
ProductSchema.pre<IProduct>("validate", function (next) {
  try {
    // manual SKU must exist (schema already requires it)
    // here we can add format rules if you want
    if (this.productId) {
      this.productId = String(this.productId).trim();
      // OPTIONAL: allow only A-Z0-9_- (uncomment if needed)
      // if (!/^[A-Za-z0-9_-]+$/.test(this.productId)) {
      //   return next(new Error("Invalid productId(SKU) format."));
      // }
    }

    computeStock(this);
    next();
  } catch (e) {
    next(e as any);
  }
});

export const Product = model<IProduct>("Product", ProductSchema);
