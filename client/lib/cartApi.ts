const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type CartItem = {
  _id: string;
  productId: string;
  variantId?: string | null;
  colorKey?: string | null;
  qty: number;
  title: string;
  image: string;
  mrp: number;
  salePrice: number;
};

export type CartData = {
  _id?: string;
  ownerKey?: string;
  items: CartItem[];
};

export function resolveImageUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const apiBase = API_BASE || "";
  const host = apiBase.replace(/\/api\/?$/, "");
  if (path.startsWith("/")) return `${host}${path}`;
  return `${host}/${path}`;
}

export async function fetchCart(): Promise<CartData> {
  const res = await fetch(`${API_BASE}/common/cart`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const json = await res.json();
  return json?.data || { items: [] };
}

export async function updateQty(itemId: string, qty: number) {
  const res = await fetch(`${API_BASE}/common/cart/qty`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ itemId, qty }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to update qty");
  return json?.data;
}

export async function removeItem(itemId: string) {
  const res = await fetch(`${API_BASE}/common/cart/item/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to remove item");
  return json?.data;
}

export async function clearCart() {
  const res = await fetch(`${API_BASE}/common/cart/clear`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to clear cart");
  return json?.data;
}
