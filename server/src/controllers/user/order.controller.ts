/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { Types } from "mongoose";
import { Cart } from "../../models/Cart.model";
import { Product } from "../../models/Product.model";
import { User } from "../../models/User.model";
import { Order } from "../../models/Order.model";

const getUserId = (req: Request) => (req as any).user?._id;
const toStr = (v: any) => String(v ?? "").trim();

export const createCodOrder = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const contact = req.body?.contact || {};
    const addressId = toStr(req.body?.addressId);

    const contactName = toStr(contact.name) || toStr((req as any).user?.name);
    const contactPhone = toStr(contact.phone) || toStr((req as any).user?.phone);
    const contactEmail = toStr(contact.email) || toStr((req as any).user?.email);

    if (!contactName || !contactPhone) {
      return res.status(400).json({ message: "Contact name and phone are required" });
    }

    if (!Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: "Valid addressId is required" });
    }

    // 1) Fetch user with addresses
    const user = await User.findById(userId).select("addresses name phone email");
    if (!user) return res.status(404).json({ message: "User not found" });

    const addr: any = (user.addresses as any).id(addressId);
    if (!addr) return res.status(400).json({ message: "Address not found" });

    // 2) Fetch cart (prefer ownerKey = u:<userId>)
    const ownerKey = `u:${String(userId)}`;
    const cart =
      (await Cart.findOne({ ownerKey })) ||
      (await Cart.findOne({ userId })); // fallback for very old carts

    if (!cart || !cart.items?.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // ✅ Only selected items go to checkout
    const selectedItems = (cart.items as any[]).filter((it) => it.isSelected === true);
    if (!selectedItems.length) {
      return res.status(400).json({ message: "No items selected for checkout" });
    }

    // 3) Validate stock (load products for selected items only)
    const productIds = selectedItems.map((it: any) => it.productId);

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select("title productId variants isActive")
      .lean();

    const productMap = new Map(products.map((p: any) => [String(p._id), p]));

    // ✅ validate only selected items (your code was validating full cart - bug)
    for (const it of selectedItems) {
      const p = productMap.get(String(it.productId));
      if (!p) {
        return res.status(409).json({ message: "Some products are unavailable now" });
      }

      const v = (p.variants || []).find((x: any) => String(x._id) === String(it.variantId));
      if (!v) {
        return res.status(409).json({ message: "Selected variant no longer exists" });
      }

      const available = Number(v.quantity || 0);
      const qty = Number(it.qty || 0);

      if (available <= 0) {
        return res.status(409).json({ message: "Variant out of stock" });
      }
      if (qty > available) {
        return res.status(409).json({
          message: "Quantity exceeds available stock",
          available,
        });
      }
    }

    // 4) Build order items snapshot + totals (✅ from selected items only)
    const orderItems = selectedItems.map((it) => {
      const p = productMap.get(String(it.productId));

      const codeFromCart = toStr(it.productCode);
      const codeFromProduct = toStr(p?.productId); // CH000001
      const productCode = codeFromCart || codeFromProduct || "NA";

      return {
        productId: new Types.ObjectId(it.productId),
        productCode,

        variantId: it.variantId ? new Types.ObjectId(it.variantId) : null,
        colorKey: it.colorKey ?? null,
        qty: Number(it.qty || 1),

        title: toStr(it.title) || toStr(p?.title) || "Product",
        image: it.image ?? null,
        mrp: Number(it.mrp || 0),
        salePrice: Number(it.salePrice || 0),
      };
    });

    const subtotal = orderItems.reduce((sum, it) => sum + it.salePrice * it.qty, 0);
    const mrpTotal = orderItems.reduce((sum, it) => sum + it.mrp * it.qty, 0);
    const savings = Math.max(0, mrpTotal - subtotal);

    // 5) Create order (COD)
    const order = await Order.create({
      userId: new Types.ObjectId(userId),
      items: orderItems,
      totals: { subtotal, mrpTotal, savings },

      contact: {
        name: contactName,
        phone: contactPhone,
        email: contactEmail || undefined,
      },

      address: {
        fullName: addr.fullName,
        phone: addr.phone,
        pincode: addr.pincode,
        state: addr.state,
        city: addr.city,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        landmark: addr.landmark,
      },

      paymentMethod: "COD",
      paymentStatus: "PENDING",
      status: "PLACED",
    });

    // 6) Make selected address default
    for (const a of user.addresses as any) a.isDefault = false;
    (user.addresses as any).id(addressId).isDefault = true;
    await user.save();

    // 7) Clear ONLY selected items from cart (✅ not full cart)
    const selectedIds = new Set(selectedItems.map((it: any) => String(it._id)));
    cart.items = (cart.items as any[]).filter((it: any) => !selectedIds.has(String(it._id))) as any;
    await cart.save();

    return res.status(201).json({
      message: "Order placed (COD)",
      data: {
        orderId: order._id,
        status: order.status,
        totals: order.totals,
      },
    });
  } catch (err: any) {
    console.error("createCodOrder error:", err);
    return res.status(500).json({
      message: "Order creation failed",
      error: err?.message || "Unknown error",
    });
  }
};
