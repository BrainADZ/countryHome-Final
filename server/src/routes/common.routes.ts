import { Router } from "express";
import { getBannerByKey } from "../controllers/common/banner.common.controller";
import {
  getMyCart,
  addToCart,
  updateCartQty,
  removeCartItem,
  clearCart,
  updateCartItemOptions,
  setCartItemSelected,
  setCartSelectAll,
} from "../controllers/common/cart.controller";
import { authOptional } from "../middleware/authOptional";
import { getHomeDealsPublic } from "../controllers/admin/homeDeals.controller";
import { publicBrands } from "../controllers/admin/brand.controller";
import { submitEnquiry } from "../controllers/common/enquiry.controller";

const router = Router();

/**
 * CART ROUTES
 * Base: /api/common/cart
 */
router.get("/cart",authOptional, getMyCart);
router.post("/cart/add",authOptional, addToCart);
router.patch("/cart/item/options",authOptional, updateCartItemOptions);
router.patch("/cart/qty",authOptional, updateCartQty);
router.delete("/cart/item/:itemId",authOptional, removeCartItem);
router.delete("/cart/clear",authOptional, clearCart);
router.patch("/cart/item/select",authOptional, setCartItemSelected);
router.patch("/cart/select-all",authOptional, setCartSelectAll);
router.post("/enquiry", submitEnquiry);
// home page routes
router.get("/home-deals", getHomeDealsPublic);
/**
 * PUBLIC BRANDS
 * Base: /api/brands
 * Returns only active brands (sorted)
 */
router.get("/brands/", publicBrands);
/**
 * BANNERS (KEEP THIS LAST)
 * GET /api/common/:key
 */
router.get("/:key", getBannerByKey);


export default router;
