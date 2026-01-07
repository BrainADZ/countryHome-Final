import mongoose, { Schema, Types, Document, Model } from "mongoose";

export interface IOrderItem {
  productId: Types.ObjectId;
  productCode: string,
  variantId?: Types.ObjectId | null;
  colorKey?: string | null;
  qty: number;

  title: string;
  image?: string | null;
  mrp: number;
  salePrice: number;
}

export interface IOrderAddress {
  fullName: string;
  phone: string;
  pincode: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
}

export interface IOrderContact {
  name: string;
  phone: string;
  email?: string;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;

  items: IOrderItem[];

  totals: {
    subtotal: number;   // sum(salePrice*qty)
    mrpTotal: number;   // sum(mrp*qty)
    savings: number;    // mrpTotal - subtotal
  };

  contact: IOrderContact;
  address: IOrderAddress;

  paymentMethod: "COD" | "ONLINE";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  status: "PLACED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productCode: { type: String, required: true, trim: true },
    variantId: { type: Schema.Types.ObjectId, required: false, default: null },
    colorKey: { type: String, required: false, default: null },
    qty: { type: Number, required: true, min: 1 },

    title: { type: String, required: true },
    image: { type: String, default: null },
    mrp: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    items: { type: [OrderItemSchema], default: [], required: true },

    totals: {
      subtotal: { type: Number, required: true },
      mrpTotal: { type: Number, required: true },
      savings: { type: Number, required: true },
    },

    contact: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: false, trim: true },
    },

    address: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      addressLine1: { type: String, required: true, trim: true },
      addressLine2: { type: String, required: false, trim: true },
      landmark: { type: String, required: false, trim: true },
    },

    paymentMethod: { type: String, enum: ["COD", "ONLINE"], required: true },
    paymentStatus: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },

    status: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PLACED",
    },
  },
  { timestamps: true }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
