import { Request, Response } from "express";
import { Brand } from "../../models/brand.model";

// ✅ Multer file type in request
type MulterReq = Request & { file?: Express.Multer.File };

const toUploadsPath = (file?: Express.Multer.File) => {
  if (!file) return null;
  return `/uploads/${file.filename}`;
};

// ADMIN: Create
export const createBrand = async (req: Request, res: Response) => {
  try {
    const mreq = req as MulterReq;
    const { name, sortOrder, isActive } = req.body;

    const imagePath = toUploadsPath(mreq.file);
    if (!imagePath) return res.status(400).json({ message: "Image is required" });
    if (!name) return res.status(400).json({ message: "Name is required" });

    const brand = await Brand.create({
      name: String(name),
      image: imagePath,
      sortOrder: Number(sortOrder ?? 0),
      isActive: typeof isActive === "string" ? isActive === "true" : Boolean(isActive),
    });

    return res.status(201).json({ message: "Brand created", brand });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// ADMIN: List (all)
export const adminListBrands = async (_req: Request, res: Response) => {
  try {
    const brands = await Brand.find().sort({ sortOrder: 1, createdAt: -1 });
    return res.json({ brands });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// ADMIN: Update
export const updateBrand = async (req: Request, res: Response) => {
  try {
    const mreq = req as MulterReq;
    const { id } = req.params;
    const { name, sortOrder, isActive } = req.body;

    const update: any = {};
    if (name !== undefined) update.name = String(name);
    if (sortOrder !== undefined) update.sortOrder = Number(sortOrder);
    if (isActive !== undefined) {
      update.isActive = typeof isActive === "string" ? isActive === "true" : Boolean(isActive);
    }

    const imagePath = toUploadsPath(mreq.file);
    if (imagePath) update.image = imagePath;

    const brand = await Brand.findByIdAndUpdate(id, update, { new: true });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    return res.json({ message: "Brand updated", brand });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// ADMIN: Delete
export const deleteBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });
    return res.json({ message: "Brand deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// ADMIN: Toggle
export const toggleBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    brand.isActive = !brand.isActive;
    await brand.save();

    return res.json({ message: "Brand toggled", brand });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// PUBLIC
export const publicBrands = async (_req: Request, res: Response) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
    return res.json({ brands });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
