import { Types } from "mongoose";
import crypto from "crypto";
import { Cart } from "../../models/Cart.model";
import { Product } from "../../models/Product.model";
/** helpers */
const normalizeColorKey = (v) => {
    if (v === undefined || v === null)
        return null;
    const s = String(v).trim().toLowerCase();
    return s.length ? s : null;
};
const toPositiveInt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0)
        return null;
    return Math.floor(n);
};
const oid = (v) => String(v || "");
const lineMatches = (it, productId, variantId, colorKey) => {
    const p = oid(it.productId);
    const v = oid(it.variantId);
    const c = it.colorKey ? String(it.colorKey).trim().toLowerCase() : null;
    return p === productId && v === variantId && c === colorKey;
};
// if someday login exists, this will work too
const getUserId = (req) => req.user?._id || null;
const GUEST_COOKIE = "guestId";
const getOrCreateGuestId = (req, res) => {
    const existing = req.cookies?.[GUEST_COOKIE];
    if (existing && String(existing).trim())
        return String(existing).trim();
    const gid = crypto.randomUUID(); // Node 18+
    res.cookie(GUEST_COOKIE, gid, {
        httpOnly: true,
        sameSite: "lax",
        // secure: true, // enable on HTTPS production
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });
    return gid;
};
const getOwner = (req, res) => {
    const userId = getUserId(req);
    if (userId) {
        return {
            ownerKey: `u:${String(userId)}`,
            userId,
            guestId: null,
        };
    }
    const guestId = getOrCreateGuestId(req, res);
    return {
        ownerKey: `g:${guestId}`,
        userId: null,
        guestId,
    };
};
const getOrCreateCart = async (ownerKey, userId, guestId) => {
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
export const getMyCart = async (req, res, next) => {
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
        const productIds = (cart.items || []).map((i) => i.productId);
        const products = await Product.find({
            _id: { $in: productIds },
            isActive: true,
        })
            .select("title slug featureImage galleryImages variants colors isActive")
            .lean();
        const map = new Map(products.map((p) => [String(p._id), p]));
        const items = (cart.items || []).map((it) => ({
            ...it,
            product: map.get(String(it.productId)) || null,
        }));
        return res.status(200).json({
            message: "Cart fetched",
            data: { ...cart, items },
        });
    }
    catch (err) {
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
export const addToCart = async (req, res) => {
    console.log("Origin:", req.headers.origin);
    console.log("guestId cookie:", req.cookies?.guestId);
    try {
        const { productId, variantId = null, colorKey = null, qty = 1, } = req.body;
        const safeQty = Math.max(1, Number(qty) || 1);
        const normColorKey = typeof colorKey === "string" ? colorKey.trim().toLowerCase() || null : null;
        // 1) Load product (lean for speed)
        const product = await Product.findById(productId).lean();
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        const productTitle = product.title || "Product";
        const productMrp = Number(product.mrp) || 0;
        const productSale = Number(product.salePrice) || 0;
        // NOTE: use your actual product featured image field name here:
        // e.g. product.featureImage / product.image / product.thumbnail
        const productImage = product.featureImage ||
            (Array.isArray(product.galleryImages) && product.galleryImages.length ? product.galleryImages[0] : null) ||
            null;
        const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
        // 2) Resolve chosen variant (if variants exist)
        let chosenVariant = null;
        if (hasVariants) {
            if (!variantId) {
                return res.status(400).json({ message: "variantId is required for this product" });
            }
            chosenVariant = product.variants.find((v) => String(v._id) === String(variantId));
            if (!chosenVariant) {
                return res.status(400).json({ message: "Invalid variantId" });
            }
        }
        // 3) Price with fallback:
        // - if variant exists but prices missing -> use product prices
        const resolvedMrp = hasVariants && chosenVariant?.mrp != null && !Number.isNaN(Number(chosenVariant.mrp))
            ? Number(chosenVariant.mrp)
            : productMrp;
        const resolvedSalePrice = hasVariants &&
            chosenVariant?.salePrice != null &&
            !Number.isNaN(Number(chosenVariant.salePrice))
            ? Number(chosenVariant.salePrice)
            : productSale;
        // 4) Image with fallback:
        // color.image -> variant.image -> product.featureImage
        const variantImage = (hasVariants && (chosenVariant?.image || chosenVariant?.featuredImage)) || null;
        let colorImage = null;
        if (hasVariants && normColorKey && Array.isArray(chosenVariant?.colors)) {
            const selectedColor = chosenVariant.colors.find((c) => String(c.key || c.colorKey || "").trim().toLowerCase() === normColorKey);
            colorImage = selectedColor?.image || selectedColor?.img || null;
        }
        const resolvedImage = colorImage || variantImage || productImage;
        // 5) Owner key
        // 5) Owner key (ALWAYS from cookie via getOwner)
        const { ownerKey, userId, guestId } = getOwner(req, res);
        // 6) Get or create cart
        const cart = await getOrCreateCart(ownerKey, userId, guestId);
        // 7) Merge key: productId + variantId + colorKey
        const idx = cart.items.findIndex((it) => {
            const sameProduct = String(it.productId) === String(productId);
            const sameVariant = String(it.variantId || "") === String(variantId || "");
            const sameColor = String(it.colorKey || "") === String(normColorKey || "");
            return sameProduct && sameVariant && sameColor;
        });
        // 8) Build snapshot payload
        const payload = {
            productId,
            variantId: hasVariants ? variantId : null,
            colorKey: normColorKey,
            qty: safeQty,
            // snapshots
            title: productTitle,
            image: resolvedImage, // fallback already applied
            mrp: resolvedMrp, // fallback already applied
            salePrice: resolvedSalePrice, // fallback already applied
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
        }
        else {
            cart.items.push(payload);
        }
        await cart.save();
        return res.json({ message: "Added to cart", data: cart });
    }
    catch (err) {
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
export const updateCartQty = async (req, res, next) => {
    try {
        const { ownerKey, userId, guestId } = getOwner(req, res);
        const { itemId, qty } = req.body;
        if (!Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ message: "Invalid itemId" });
        }
        const newQty = toPositiveInt(qty);
        if (!newQty) {
            return res.status(400).json({ message: "Invalid qty" });
        }
        const cart = await getOrCreateCart(ownerKey, userId, guestId);
        const item = cart.items.find((it) => String(it._id) === String(itemId));
        if (!item)
            return res.status(404).json({ message: "Cart item not found" });
        const product = await Product.findById(item.productId)
            .select("isActive variants")
            .lean();
        if (!product || product.isActive === false) {
            return res.status(409).json({ message: "Product unavailable now" });
        }
        const variant = (product.variants || []).find((v) => String(v._id) === String(item.variantId));
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
    }
    catch (err) {
        next(err);
    }
};
/**
 * DELETE /cart/item/:itemId
 * remove single line item
 */
export const removeCartItem = async (req, res, next) => {
    try {
        const { ownerKey, userId, guestId } = getOwner(req, res);
        const { itemId } = req.params;
        if (!Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ message: "Invalid itemId" });
        }
        const cart = await getOrCreateCart(ownerKey, userId, guestId);
        const before = cart.items.length;
        cart.items = cart.items.filter((it) => String(it._id) !== String(itemId));
        if (cart.items.length === before) {
            return res.status(404).json({ message: "Cart item not found" });
        }
        await cart.save();
        return res.status(200).json({ message: "Item removed", data: cart });
    }
    catch (err) {
        next(err);
    }
};
/**
 * DELETE /cart/clear
 * clears all items
 */
export const clearCart = async (req, res, next) => {
    try {
        const { ownerKey, userId, guestId } = getOwner(req, res);
        const cart = await getOrCreateCart(ownerKey, userId, guestId);
        cart.items = [];
        await cart.save();
        return res.status(200).json({ message: "Cart cleared", data: cart });
    }
    catch (err) {
        next(err);
    }
};
