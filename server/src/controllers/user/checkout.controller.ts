/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { Cart } from "../../models/Cart.model";
import { Product } from "../../models/Product.model";

const getUserId = (req: Request) => (req as any).user?._id;

export const getCheckoutSummary = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // 1) Fetch cart (ownerKey is primary)
    const ownerKey = `u:${String(userId)}`;
    const cart =
      (await Cart.findOne({ ownerKey })) ||
      (await Cart.findOne({ userId })); // fallback for older carts

    if (!cart || !cart.items?.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // ✅ ONLY selected items go to checkout
    const selectedItems = (cart.items as any[]).filter((it) => it.isSelected === true);
    if (!selectedItems.length) {
      return res.status(400).json({ message: "No items selected for checkout" });
    }

    // 2) Fetch all products in one go (only for selected items)
    const productIds = selectedItems.map((it: any) => it.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select("productId title variants isActive")
      .lean();

    const productMap = new Map(products.map((p: any) => [String(p._id), p]));

    // 3) Validate + build snapshot (only selected items)
    const items = selectedItems.map((it: any) => {
      const product = productMap.get(String(it.productId));
      if (!product) {
        // product missing or inactive
        throw new Error("Some products are unavailable");
      }

      // Your cart flow assumes variant products generally
      const variant = (product.variants || []).find(
        (v: any) => String(v._id) === String(it.variantId)
      );

      if (!variant) {
        throw new Error("Selected variant no longer exists");
      }

      const available = Number(variant.quantity || 0);
      const qty = Number(it.qty || 0);

      if (available <= 0) {
        throw new Error("Stock issue for some items");
      }
      if (qty > available) {
        throw new Error("Stock issue for some items");
      }

      const lineTotal = Number(it.salePrice || 0) * qty;

      return {
        productId: it.productId,
        // ✅ Prefer snapshot from cart if you store it, else from Product.productId
        productCode: String(it.productCode || product.productId || "NA"),

        variantId: it.variantId,
        colorKey: it.colorKey ?? null,
        qty,

        title: String(it.title || product.title || "Product"),
        image: it.image ?? null,

        mrp: Number(it.mrp || 0),
        salePrice: Number(it.salePrice || 0),
        lineTotal,
      };
    });

    // 4) Totals
    const subtotal = items.reduce((s, i) => s + Number(i.lineTotal || 0), 0);
    const mrpTotal = items.reduce((s, i) => s + Number(i.mrp || 0) * Number(i.qty || 0), 0);
    const savings = Math.max(0, mrpTotal - subtotal);

    return res.status(200).json({
      message: "Checkout summary",
      data: {
        items,
        totals: { subtotal, mrpTotal, savings },
      },
    });
  } catch (err: any) {
    // keep message clean for UI
    return res.status(409).json({
      message: err?.message || "Checkout summary failed",
    });
  }
};
