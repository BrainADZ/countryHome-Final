/* eslint-disable @typescript-eslint/no-explicit-any */
export type CartProductVariant = {
  _id: string;
  label?: string;
  size?: string;
  weight?: string;
  comboText?: string;
  mrp?: number;
  salePrice?: number;
  quantity?: number;
  images?: string[];
};

export type CartProductColor = {
  _id?: string;
  name: string;
  hex?: string;
  orderIndex?: number;
  images?: string[];
};

export type CartProduct = {
  _id: string;
  title: string;
  slug: string;
  featureImage?: string;
  galleryImages?: string[];
  variants?: CartProductVariant[];
  colors?: CartProductColor[];
};

export type CartItem = {
  title: string | undefined;
  _id: string;
  productId: string;
  variantId: string;
  colorKey?: string | null;
  qty: number;
  mrp: number;
  salePrice: number;

  // from enrichment
  product?: CartProduct | null;
};

export type CartData = { items: CartItem[] };

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const resolveImageUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const apiBase = API_BASE || "";
  const host = apiBase.replace(/\/api\/?$/, "");
  if (path.startsWith("/")) return `${host}${path}`;
  return `${host}/${path}`;
};

export async function fetchCart(): Promise<CartData> {
  const res = await fetch(`${API_BASE}/common/cart`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Cart fetch failed");
  return json?.data || { items: [] };
}

export async function updateQty(itemId: string, qty: number): Promise<CartData> {
  const res = await fetch(`${API_BASE}/common/cart/qty`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ itemId, qty }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Qty update failed");
  return json?.data || { items: [] };
}

export async function removeItem(itemId: string): Promise<CartData> {
  const res = await fetch(`${API_BASE}/common/cart/item/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Remove failed");
  return json?.data || { items: [] };
}

export async function clearCart(): Promise<CartData> {
  const res = await fetch(`${API_BASE}/common/cart/clear`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Clear failed");
  return json?.data || { items: [] };
}

/** ✅ NEW: change variant/color from cart page */
export async function updateItemOptions(itemId: string, variantId: string, colorKey?: string | null): Promise<CartData> {
  const res = await fetch(`${API_BASE}/common/cart/item/options`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ itemId, variantId, colorKey }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Options update failed");
  return json?.data || { items: [] };
}

/** helpers for UI */
const norm = (v: any) => String(v ?? "").trim();
const normKey = (v: any) => norm(v).toLowerCase();

export function getVariantText(product?: CartProduct | null, variantId?: string) {
  const v = (product?.variants || []).find((x) => String(x._id) === String(variantId));
  if (!v) return "Variant";
  return (
    v.label ||
    v.comboText ||
    v.size ||
    v.weight ||
    "Variant"
  );
}

export function resolveCartItemImage(product?: CartProduct | null, variantId?: string, colorKey?: string | null) {
  if (!product) return "";

  const v = (product.variants || []).find((x) => String(x._id) === String(variantId));
  const c = (product.colors || []).find((x) => normKey(x.name) === normKey(colorKey));

  const vImg = (v?.images || []).find(Boolean);
  const cImg = (c?.images || []).find(Boolean);
  const gImg = (product.galleryImages || []).find(Boolean);
  const fImg = product.featureImage || "";

  // ✅ priority as per your requirement
  return vImg || cImg || gImg || fImg || "";
}
