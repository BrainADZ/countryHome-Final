/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import crypto from "crypto";
import { Cart } from "../../models/Cart.model";
import { Product } from "../../models/Product.model";

/** helpers */
const normalizeColorKey = (v: any) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().toLowerCase();
  return s.length ? s : null;
};

const toPositiveInt = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
};

const oid = (v: any) => String(v || "");

const lineMatches = (
  it: any,
  productId: string,
  variantId: string,
  colorKey: string | null
) => {
  const p = oid(it.productId);
  const v = oid(it.variantId);
  const c = it.colorKey ? String(it.colorKey).trim().toLowerCase() : null;
  return p === productId && v === variantId && c === colorKey;
};

// if someday login exists, this will work too
const getUserId = (req: Request) => (req as any).user?._id || null;

const GUEST_COOKIE = "guestId";

const getOrCreateGuestId = (req: Request, res: Response) => {
  const existing = (req as any).cookies?.[GUEST_COOKIE];
  if (existing && String(existing).trim()) return String(existing).trim();

  const gid = crypto.randomUUID(); // Node 18+
  res.cookie(GUEST_COOKIE, gid, {
    httpOnly: true,
    sameSite: "lax",
    // secure: true, // enable on HTTPS production
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  });
  return gid;
};

const getOwner = (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (userId) {
    return {
      ownerKey: `u:${String(userId)}`,
      userId,
      guestId: null as string | null,
    };
  }

  const guestId = getOrCreateGuestId(req, res);
  return {
    ownerKey: `g:${guestId}`,
    userId: null as any,
    guestId,
  };
};

const getOrCreateCart = async (
  ownerKey: string,
  userId: any,
  guestId: any
) => {
  let cart = await Cart.findOne({ ownerKey });
  if (!cart) {
    cart = await Cart.create({
      ownerKey,
      userId: userId ?? null,
      guestId: guestId ?? null,
      items: [],
    });
  }
  return cart;
};

/**
 * GET /cart
 * returns cart + lightweight product enrichment for UI
 */
export const getMyCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ownerKey } = getOwner(req, res);

    const cart = await Cart.findOne({ ownerKey }).lean();
    if (!cart) {
      return res.status(200).json({
        message: "Cart fetched",
        data: { items: [] },
      });
    }

    // enrich: fetch products once (for cart UI / image resolution)
    const productIds = (cart.items || []).map((i: any) => i.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select("title slug featureImage galleryImages variants colors isActive")
      .lean();

    const map = new Map(products.map((p: any) => [String(p._id), p]));

    const items = (cart.items || []).map((it: any) => ({
      ...it,
      product: map.get(String(it.productId)) || null,
    }));

    return res.status(200).json({
      message: "Cart fetched",
      data: { ...cart, items },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /cart/add
 * body: { productId, variantId, colorKey?, qty }
 * - merge same (productId + variantId + colorKey)
 * - stock check using variant.quantity
 * - price snapshot from variant.mrp & variant.salePrice
 */
export const addToCart = async (req: any, res: any) => {
  console.log("Origin:", req.headers.origin);
console.log("guestId cookie:", req.cookies?.guestId);
  try {
    const {
      productId,
      variantId = null,
      colorKey = null,
      qty = 1,
    } = req.body;

    const safeQty = Math.max(1, Number(qty) || 1);
    const normColorKey =
      typeof colorKey === "string" ? colorKey.trim().toLowerCase() || null : null;

    // 1) Load product (lean for speed)
    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const productTitle = product.title || "Product";

    const productMrp = Number(product.mrp) || 0;
    const productSale = Number(product.salePrice) || 0;

    // NOTE: use your actual product featured image field name here:
    // e.g. product.featureImage / product.image / product.thumbnail
    const productImage =
      product.featureImage ||
      (Array.isArray(product.galleryImages) && product.galleryImages.length ? product.galleryImages[0] : null) ||
      null;


    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

    // 2) Resolve chosen variant (if variants exist)
    let chosenVariant: any = null;

    if (hasVariants) {
      if (!variantId) {
        return res.status(400).json({ message: "variantId is required for this product" });
      }

      chosenVariant = product.variants.find(
        (v: any) => String(v._id) === String(variantId)
      );

      if (!chosenVariant) {
        return res.status(400).json({ message: "Invalid variantId" });
      }
    }

    // 3) Price with fallback:
    // - if variant exists but prices missing -> use product prices
    const resolvedMrp =
      hasVariants && chosenVariant?.mrp != null && !Number.isNaN(Number(chosenVariant.mrp))
        ? Number(chosenVariant.mrp)
        : productMrp;

    const resolvedSalePrice =
      hasVariants &&
        chosenVariant?.salePrice != null &&
        !Number.isNaN(Number(chosenVariant.salePrice))
        ? Number(chosenVariant.salePrice)
        : productSale;

    // 4) Image with fallback:
    // color.image -> variant.image -> product.featureImage
    const variantImage =
      (hasVariants && (chosenVariant?.image || chosenVariant?.featuredImage)) || null;

    let colorImage: string | null = null;

    if (hasVariants && normColorKey && Array.isArray(chosenVariant?.colors)) {
      const selectedColor = chosenVariant.colors.find(
        (c: any) => String(c.key || c.colorKey || "").trim().toLowerCase() === normColorKey
      );
      colorImage = selectedColor?.image || selectedColor?.img || null;
    }

    const resolvedImage = colorImage || variantImage || productImage;

    // 5) Owner key
// 5) Owner key (ALWAYS from cookie via getOwner)
const { ownerKey, userId, guestId } = getOwner(req, res);

// 6) Get or create cart
const cart = await getOrCreateCart(ownerKey, userId, guestId);


    // 7) Merge key: productId + variantId + colorKey
    const idx = cart.items.findIndex((it: any) => {
      const sameProduct = String(it.productId) === String(productId);
      const sameVariant = String(it.variantId || "") === String(variantId || "");
      const sameColor = String(it.colorKey || "") === String(normColorKey || "");
      return sameProduct && sameVariant && sameColor;
    });

    // 8) Build snapshot payload
    const payload: any = {
      productId,
      variantId: hasVariants ? variantId : null,
      colorKey: normColorKey,
      qty: safeQty,

      // snapshots
      title: productTitle,
      image: resolvedImage,            // fallback already applied
      mrp: resolvedMrp,                // fallback already applied
      salePrice: resolvedSalePrice,    // fallback already applied

      addedAt: new Date(),
      updatedAt: new Date(),
    };

    if (idx >= 0) {
      // increment qty; keep latest snapshot as well (optional)
      cart.items[idx].qty += safeQty;
      cart.items[idx].updatedAt = new Date();

      // Optional: update snapshot to latest resolved values
      cart.items[idx].title = payload.title;
      cart.items[idx].image = payload.image;
      cart.items[idx].mrp = payload.mrp;
      cart.items[idx].salePrice = payload.salePrice;
      cart.items[idx].colorKey = payload.colorKey;
      cart.items[idx].variantId = payload.variantId;
    } else {
      cart.items.push(payload);
    }

    await cart.save();

    return res.json({ message: "Added to cart", data: cart });
  } catch (err: any) {
    console.error("❌ addToCart error:", err);
    console.error("❌ addToCart error message:", err?.message);
    console.error("❌ addToCart error stack:", err?.stack);
    return res.status(500).json({
      message: "Server error",
      error: err?.message || "Unknown error",
    });
  }

};


/**
 * PATCH /cart/qty
 * body: { itemId, qty }
 * - sets absolute qty
 * - validates stock against latest product variant.quantity
 */
export const updateCartQty = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ownerKey, userId, guestId } = getOwner(req, res);

    const { itemId, qty } = req.body as any;

    if (!Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }
    const newQty = toPositiveInt(qty);
    if (!newQty) {
      return res.status(400).json({ message: "Invalid qty" });
    }

    const cart = await getOrCreateCart(ownerKey, userId, guestId);

    const item: any = cart.items.find(
      (it: any) => String(it._id) === String(itemId)
    );
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    const product = await Product.findById(item.productId)
      .select("isActive variants")
      .lean();

    if (!product || product.isActive === false) {
      return res.status(409).json({ message: "Product unavailable now" });
    }

    const variant = (product.variants || []).find(
      (v: any) => String(v._id) === String(item.variantId)
    );
    if (!variant) {
      return res
        .status(409)
        .json({ message: "Selected variant no longer exists" });
    }

    const available = Number(variant.quantity || 0);
    if (available <= 0) {
      return res.status(409).json({ message: "Selected variant out of stock" });
    }
    if (newQty > available) {
      return res.status(409).json({
        message: "Quantity exceeds available stock",
        available,
      });
    }

    item.qty = newQty;
    item.updatedAt = new Date();

    await cart.save();
    return res.status(200).json({ message: "Quantity updated", data: cart });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /cart/item/:itemId
 * remove single line item
 */
/**
 * PATCH /cart/item/options
 * body: { itemId, variantId, colorKey? }
 * - change commercial variant (price snapshot must update)
 * - change colorKey (visual only)
 * - stock check: current qty <= new variant.quantity
 * - merge if same (productId+variantId+colorKey) already exists
 */
export const updateCartItemOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { itemId, variantId, colorKey } = req.body as any;

    if (!Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }
    if (!Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ message: "variantId is required and must be valid" });
    }

    const normalizedColor = normalizeColorKey(colorKey);

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(200).json({ message: "Cart empty", data: { userId, items: [] } });
    }

    const current: any = cart.items.find((it: any) => String(it._id) === String(itemId));
    if (!current) return res.status(404).json({ message: "Cart item not found" });

    const product = await Product.findById(current.productId)
      .select("isActive variants colors")
      .lean();

    if (!product || product.isActive === false) {
      return res.status(409).json({ message: "Product unavailable now" });
    }

    const newVariant = (product.variants || []).find((v: any) => String(v._id) === String(variantId));
    if (!newVariant) {
      return res.status(400).json({ message: "Variant not found for this product" });
    }

    // optional: validate color belongs to product.colors
    if (normalizedColor) {
      const ok = (product.colors || []).some((c: any) => {
        const nm = String(c?.name || "").trim().toLowerCase();
        return nm && nm === normalizedColor;
      });
      if (!ok) return res.status(400).json({ message: "Invalid color for this product" });
    }

    const available = Number(newVariant.quantity || 0);
    if (available <= 0) return res.status(409).json({ message: "Selected variant is out of stock" });
    if (Number(current.qty || 1) > available) {
      return res.status(409).json({
        message: "Current quantity exceeds available stock for selected variant",
        available,
      });
    }

    const nextVariantId = String(variantId);
    const nextColorKey = normalizedColor;

    // ✅ merge if same line already exists
    const targetIdx = cart.items.findIndex((it: any) =>
      lineMatches(it, String(current.productId), nextVariantId, nextColorKey)
    );

    // update snapshot because commercial variant changed
    const mrpSnap = Number(newVariant.mrp || 0);
    const saleSnap = Number(newVariant.salePrice || 0);

    if (targetIdx > -1) {
      const target: any = cart.items[targetIdx];

      // if target is different item, merge qty then remove current
      if (String(target._id) !== String(current._id)) {
        const mergedQty = Number(target.qty || 0) + Number(current.qty || 0);
        if (mergedQty > available) {
          return res.status(409).json({
            message: "Merged quantity exceeds available stock for selected variant",
            available,
          });
        }

        target.qty = mergedQty;
        target.variantId = new Types.ObjectId(variantId);
        target.colorKey = nextColorKey;
        target.mrp = mrpSnap;
        target.salePrice = saleSnap;
        target.updatedAt = new Date();

        cart.items = cart.items.filter((it: any) => String(it._id) !== String(current._id)) as any;
      } else {
        // same item, just update options
        current.variantId = new Types.ObjectId(variantId);
        current.colorKey = nextColorKey;
        current.mrp = mrpSnap;
        current.salePrice = saleSnap;
        current.updatedAt = new Date();
      }
    } else {
      // no merge, update current item
      current.variantId = new Types.ObjectId(variantId);
      current.colorKey = nextColorKey;
      current.mrp = mrpSnap;
      current.salePrice = saleSnap;
      current.updatedAt = new Date();
    }

    await cart.save();
    return res.status(200).json({ message: "Item options updated", data: cart });
  } catch (err) {
    next(err);
  }
};

export const removeCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ownerKey, userId, guestId } = getOwner(req, res);

    const { itemId } = req.params;
    if (!Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }

    const cart = await getOrCreateCart(ownerKey, userId, guestId);

    const before = cart.items.length;
    cart.items = cart.items.filter(
      (it: any) => String(it._id) !== String(itemId)
    ) as any;

    if (cart.items.length === before) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await cart.save();
    return res.status(200).json({ message: "Item removed", data: cart });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /cart/clear
 * clears all items
 */
export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ownerKey, userId, guestId } = getOwner(req, res);

    const cart = await getOrCreateCart(ownerKey, userId, guestId);

    cart.items = [] as any;
    await cart.save();

    return res.status(200).json({ message: "Cart cleared", data: cart });
  } catch (err) {
    next(err);
  }
};
