/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  clearCart,
  fetchCart,
  removeItem,
  resolveImageUrl,
  updateQty,
  type CartData,
} from "@/lib/cartApi";

function money(n: number) {
  return `₹${Number(n || 0).toFixed(0)}`;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartData>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = cart.items || [];

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.salePrice || 0) * Number(it.qty || 0), 0);
  }, [items]);

  const mrpTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.mrp || 0) * Number(it.qty || 0), 0);
  }, [items]);

  const savings = Math.max(0, mrpTotal - subtotal);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchCart();
        setCart(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load cart");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onChangeQty = async (itemId: string, nextQty: number) => {
    if (nextQty < 1) return;
    try {
      setBusyId(itemId);
      setError(null);
      const updated = await updateQty(itemId, nextQty);
      setCart(updated);
    } catch (e: any) {
      setError(e?.message || "Qty update failed");
    } finally {
      setBusyId(null);
    }
  };

  const onRemove = async (itemId: string) => {
    try {
      setBusyId(itemId);
      setError(null);
      const updated = await removeItem(itemId);
      setCart(updated);
    } catch (e: any) {
      setError(e?.message || "Remove failed");
    } finally {
      setBusyId(null);
    }
  };

  const onClear = async () => {
    try {
      setBusyId("CLEAR_ALL");
      setError(null);
      const updated = await clearCart();
      setCart(updated);
    } catch (e: any) {
      setError(e?.message || "Clear failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-6 w-40 bg-gray-200 animate-pulse rounded" />
        <div className="mt-6 grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border bg-gray-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-3xl border bg-white p-10 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
          <p className="mt-2 text-gray-600">Add products to proceed to checkout.</p>
          <Link
            href="/website/products"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-black"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600">{items.length} item(s)</p>
        </div>

        <button
          onClick={onClear}
          disabled={busyId === "CLEAR_ALL"}
          className="w-fit rounded-xl border px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        >
          {busyId === "CLEAR_ALL" ? "Clearing..." : "Clear cart"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((it) => {
            const img = resolveImageUrl(it.image);
            const lineTotal = Number(it.salePrice || 0) * Number(it.qty || 0);
            const lineMrp = Number(it.mrp || 0) * Number(it.qty || 0);

            return (
              <div
                key={it._id}
                className="rounded-3xl border bg-white p-4 sm:p-5"
              >
                <div className="flex gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={it.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {it.title}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {it.variantId ? `Variant: ${String(it.variantId).slice(-6)}` : "Standard"}
                          {it.colorKey ? ` • Color: ${it.colorKey}` : ""}
                        </div>
                      </div>

                      <button
                        onClick={() => onRemove(it._id)}
                        disabled={busyId === it._id}
                        className="rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {busyId === it._id ? "Removing..." : "Remove"}
                      </button>
                    </div>

                    {/* Price */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-end gap-2">
                        <div className="text-base font-bold text-gray-900">
                          {money(it.salePrice)}
                        </div>
                        {Number(it.mrp) > Number(it.salePrice) && (
                          <div className="text-sm text-gray-500 line-through">
                            {money(it.mrp)}
                          </div>
                        )}
                      </div>

                      {/* Qty */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onChangeQty(it._id, it.qty - 1)}
                          disabled={busyId === it._id || it.qty <= 1}
                          className="h-10 w-10 rounded-xl border text-lg font-semibold hover:bg-gray-50 disabled:opacity-40"
                        >
                          –
                        </button>
                        <div className="min-w-10 text-center text-sm font-semibold">
                          {it.qty}
                        </div>
                        <button
                          onClick={() => onChangeQty(it._id, it.qty + 1)}
                          disabled={busyId === it._id}
                          className="h-10 w-10 rounded-xl border text-lg font-semibold hover:bg-gray-50 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="text-gray-500">Line total</div>
                      <div className="font-semibold text-gray-900">
                        {money(lineTotal)}{" "}
                        {lineMrp > lineTotal ? (
                          <span className="ml-2 text-xs font-semibold text-emerald-700">
                            Save {money(lineMrp - lineTotal)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-3xl border bg-white p-5">
            <div className="text-lg font-bold text-gray-900">Order Summary</div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{money(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">MRP Total</span>
                <span className="font-semibold">{money(mrpTotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">You save</span>
                <span className="font-semibold text-emerald-700">{money(savings)}</span>
              </div>

              <div className="h-px bg-gray-200" />

              <div className="flex justify-between text-base">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">{money(subtotal)}</span>
              </div>
            </div>

            <button className="mt-6 w-full rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-black">
              Proceed to checkout
            </button>

            <Link
              href="/website/products"
              className="mt-3 block text-center text-sm font-semibold text-gray-700 hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
