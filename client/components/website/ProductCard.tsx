/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// components/website/ProductCard.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const resolveImageUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const apiBase = API_BASE || "";
  const host = apiBase.replace(/\/api\/?$/, "");
  if (path.startsWith("/")) return `${host}${path}`;
  return `${host}/${path}`;
};

function truncateText(text: string, limit: number) {
  if (!text) return "";
  return text.length > limit ? text.slice(0, limit) + "..." : text;
}

export type ProductCardVariant = {
  _id?: string;
  label?: string;
  size?: string;
  weight?: string;
  color?: string;
  comboText?: string;
  mrp?: number;
  salePrice?: number;
  quantity?: number;

  images?: string[];
  image?: string;
  featureImage?: string;
};

export type ProductCardProduct = {
  _id: string;
  title: string;
  slug: string;

  featureImage?: string;
  mrp?: number;
  salePrice?: number;

  totalStock?: number;
  inStock?: boolean;

  variants?: ProductCardVariant[];
};

function calcDiscountPercent(mrp?: number, sale?: number) {
  const M = Number(mrp ?? 0);
  const S = Number(sale ?? 0);
  if (!M || !S || M <= S) return 0;
  return Math.round(((M - S) / M) * 100);
}

function firstTruthy(...vals: Array<string | undefined | null>) {
  return vals.find((v) => typeof v === "string" && v.trim().length > 0)?.trim();
}

// ✅ treat invalid strings as empty
function cleanImgPath(p?: any) {
  if (p === undefined || p === null) return "";
  const s = String(p).trim();
  if (!s) return "";
  const low = s.toLowerCase();
  if (low === "undefined" || low === "null") return "";
  return s;
}

// ✅ keep variant image selection in one place (sanitized)
function getVariantFirstImage(v?: ProductCardVariant | null) {
  if (!v) return "";
  return (
    cleanImgPath(v.images?.[0]) ||
    cleanImgPath(v.featureImage) ||
    cleanImgPath(v.image) ||
    ""
  );
}


async function addToCartApi(productId: string, variantId?: string, variantImage?: string) {
  if (!productId) return;

  const res = await fetch(`${API_BASE}/common/cart/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      productId,
      variantId,
      variantImage,
      qty: 1,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Add to cart failed:", data?.message);
    return;
  }

  // ✅ refresh header counter (if you added listener)
  window.dispatchEvent(new Event("cart:updated"));

  console.log("Added to cart:", data);
}

export default function ProductCard({ product }: { product: ProductCardProduct }) {
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    variants[0]?._id
  );

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return variants.find((v) => v._id === selectedVariantId) || variants[0] || null;
  }, [hasVariants, variants, selectedVariantId]);

  // stock
  const baseOut =
    product.inStock === false ||
    (typeof product.totalStock === "number" && product.totalStock <= 0);

  const variantOut =
    hasVariants && selectedVariant ? Number(selectedVariant.quantity ?? 0) <= 0 : false;

  const isOut = baseOut || variantOut;

  // price (variant first, fallback product)
  const baseMrp = Number(product.mrp ?? 0);
  const baseSale = Number(product.salePrice ?? 0);

  const displayMrp = hasVariants ? Number(selectedVariant?.mrp ?? 0) || baseMrp : baseMrp;
  const displaySaleRaw = hasVariants ? Number(selectedVariant?.salePrice ?? 0) : baseSale;
  const displaySale = displaySaleRaw > 0 ? displaySaleRaw : displayMrp;

  const off = calcDiscountPercent(displayMrp, displaySale);

  /**
   * ✅ IMAGE LOGIC (as you asked):
   * - If NO variants => product.featureImage
   * - If variants exist => selectedVariant first image (images[0] / featureImage / image)
   * - If selectedVariant has no image => fallback to product.featureImage
   */
const rawVariantImg = hasVariants ? getVariantFirstImage(selectedVariant) : "";
const rawProductImg = cleanImgPath(product.featureImage);

const img = resolveImageUrl(rawVariantImg || rawProductImg);


  const variantChips = useMemo(() => {
    return variants
      .map((v) => ({
        id: v._id,
        text: firstTruthy(v.label, v.comboText, v.size, v.weight, v.color),
        qty: Number(v.quantity ?? 0),
      }))
      .filter((x) => !!x.text);
  }, [variants]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOut) return;

    // send selected variant image if present (optional)
    const variantImage = rawVariantImg ? resolveImageUrl(rawVariantImg) : undefined;

    if (hasVariants && !selectedVariantId) return;

    await addToCartApi(
      product._id,
      hasVariants ? selectedVariantId : undefined,
      variantImage
    );
  };

  const TITLE_LIMIT = 35;
  const titleShort = truncateText(product.title, TITLE_LIMIT);

  return (
    <div className="group">
      <Link href={`/website/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden transition hover:shadow-xl p-4 border border-gray-200">
          <div className="relative aspect-square bg-gray-50">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img} // ✅ re-render when variant changes image
                src={img}
                alt={product.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                No Image
              </div>
            )}

            <div className="absolute left-3 top-3 flex flex-col gap-2">
              {off > 0 && (
                <span className="inline-flex w-fit items-center rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {off}% OFF
                </span>
              )}

              {isOut && (
                <span className="inline-flex w-fit items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gray-900 ring-1 ring-gray-200">
                  Out of stock
                </span>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOut}
                className={`w-full rounded-xl px-3 py-2 text-sm font-semibold transition
                  ${
                    isOut
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-black"
                  }
                  opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0`}
              >
                Add to cart
              </button>
            </div>
          </div>

          <div className="mt-4">
            <h3
              className="text-[14px] font-semibold leading-snug text-gray-900"
              title={product.title}
            >
              {titleShort}
            </h3>

            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="flex items-end gap-2">
                <div className="text-[16px] font-bold text-gray-900">
                  ₹{Number(displaySale ?? 0).toFixed(0)}
                </div>

                {displayMrp > 0 && displaySale > 0 && displayMrp > displaySale && (
                  <div className="text-[12px] text-gray-500 line-through">
                    ₹{Number(displayMrp).toFixed(0)}
                  </div>
                )}
              </div>

              {displayMrp > 0 && displaySale > 0 && displayMrp > displaySale && (
                <div className="text-[12px] font-semibold text-emerald-700">
                  Save ₹{Number(displayMrp - displaySale).toFixed(0)}
                </div>
              )}
            </div>

            <div className="min-h-[42px]">
              {hasVariants && variantChips.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {variantChips.slice(0, 2).map((v) => {
                    const active = v.id && v.id === selectedVariantId;
                    const disabled = v.qty <= 0;

                    return (
                      <button
                        key={v.id || v.text}
                        type="button"
                        disabled={disabled}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (v.id) setSelectedVariantId(v.id);
                        }}
                        className={`mt-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition
                          ${
                            active
                              ? "bg-gray-900 text-white ring-gray-900"
                              : "bg-white text-gray-700 ring-gray-200 hover:ring-gray-300"
                          }
                          ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={disabled ? "Out of stock" : v.text}
                      >
                        {v.text}
                      </button>
                    );
                  })}

                  {variantChips.length > 4 && (
                    <span className="text-[11px] text-gray-500 px-1 py-1 mt-2">
                      +{variantChips.length - 4} more
                    </span>
                  )}
                </div>
              ) : (
                <div className="invisible text-[11px]">placeholder</div>
              )}
            </div>

            {hasVariants && selectedVariant && (
              <div className="mt-2 text-[12px] text-gray-500">
                {Number(selectedVariant.quantity ?? 0) > 0 ? "In stock" : "Currently unavailable"}
              </div>
            )}

            {!hasVariants && typeof product.totalStock === "number" && (
              <div className="mt-2 text-[12px] text-gray-500">
                {product.totalStock > 0 ? "In stock" : "Currently unavailable"}
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-transparent via-gray-200 to-transparent opacity-0 transition group-hover:opacity-100" />
        </div>
      </Link>
    </div>
  );
}
