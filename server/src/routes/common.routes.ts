import { Router } from "express";
import { getBannerByKey } from "../controllers/common/banner.common.controller";
import {
  getMyCart,
  addToCart,
  updateCartQty,
  removeCartItem,
  clearCart,
  updateCartItemOptions,
} from "../controllers/common/cart.controller";

const router = Router();

/**
 * CART ROUTES
 * Base: /api/common/cart
 */
router.get("/cart", getMyCart);
router.post("/cart/add", addToCart);
router.patch("/cart/item/options", updateCartItemOptions);
router.patch("/cart/qty", updateCartQty);
router.delete("/cart/item/:itemId", removeCartItem);
router.delete("/cart/clear", clearCart);

/**
 * BANNERS (KEEP THIS LAST)
 * GET /api/common/:key
 */
router.get("/:key", getBannerByKey);

export default router;
