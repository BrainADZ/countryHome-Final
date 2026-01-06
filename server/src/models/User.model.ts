import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;

  emailVerified: boolean;

  role: "user";

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: { type: String, required: true, trim: true, index: true },

    password: { type: String, required: true },

    emailVerified: { type: Boolean, default: false },

    role: { type: String, enum: ["user"], default: "user" },
  },
  { timestamps: true }
);

// ✅ Avoid duplicates
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
