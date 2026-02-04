import mongoose, { Schema, Types, Document, Model } from "mongoose";

export type DealPickType = "category" | "subcategory";

export interface IDealPick {
  type: DealPickType;
  id: Types.ObjectId;
}

export interface IDealSection {
  key: "top_picks" | "section_2";
  title?: string;
  picks: IDealPick[];
}

export interface IHomeDeals extends Document {
  isActive: boolean;
  sections: IDealSection[];
}

const DealPickSchema = new Schema<IDealPick>(
  {
    type: { type: String, enum: ["category", "subcategory"], required: true },
    id: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  },
  { _id: false }
);

const DealSectionSchema = new Schema<IDealSection>(
  {
    key: { type: String, enum: ["top_picks", "section_2"], required: true },
    title: { type: String, trim: true },
    picks: { type: [DealPickSchema], default: [] },
  },
  { _id: false }
);

const HomeDealsSchema = new Schema<IHomeDeals>(
  {
    isActive: { type: Boolean, default: true },
    sections: {
      type: [DealSectionSchema],
      default: [
        { key: "top_picks", title: "Top picks of the sale", picks: [] },
        { key: "section_2", title: "Winter Essentials for You", picks: [] },
      ],
    },
  },
  { timestamps: true }
);

const HomeDeals: Model<IHomeDeals> =
  (mongoose.models.HomeDeals as Model<IHomeDeals>) ||
  mongoose.model<IHomeDeals>("HomeDeals", HomeDealsSchema);

export default HomeDeals;
