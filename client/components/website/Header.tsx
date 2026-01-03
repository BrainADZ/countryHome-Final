/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

async function fetchCartCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/common/cart`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    const items = json?.data?.items || [];
    return items.reduce((sum: number, it: any) => sum + Number(it.qty || 0), 0);
  } catch {
    return 0;
  }
}

export function WebsiteHeader() {
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  // ✅ cart counter state
  const [cartCount, setCartCount] = useState<number>(0);

  // ✅ initial load
  useEffect(() => {
    (async () => {
      const count = await fetchCartCount();
      setCartCount(count);
    })();
  }, []);

  // ✅ optional: refresh count when cart changes (trigger this event after addToCart)
  useEffect(() => {
    const handler = async () => {
      const count = await fetchCartCount();
      setCartCount(count);
    };
    window.addEventListener("cart:updated", handler);
    return () => window.removeEventListener("cart:updated", handler);
  }, []);

  const CartIconWithBadge = useMemo(() => {
    return (
      <Link href="/website/cart" className="relative hover:text-[#82008F]">
        <ShoppingCart className="h-[22px] w-[22px]" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#82008F] text-white text-[11px] font-semibold flex items-center justify-center leading-none">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </Link>
    );
  }, [cartCount]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-[#cecede]">
        <div className="max-w-[1400px] mx-auto px-2 sm:px-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 sm:py-4 gap-3">

            {/* LEFT: LOGO */}
            <div className="flex items-center justify-between md:justify-start">
              <Link href="/" className="select-none">
                <img src="/logo.jpg" alt="Mechkart" className="w-60 h-16" />
              </Link>

              {/* MOBILE ACTIONS */}
              <div className="flex md:hidden items-center gap-3 text-[14px] font-medium text-gray-700">
                <button
                  onClick={() => {
                    setMode("login");
                    setShowAuth(true);
                  }}
                  className="hover:text-[#82008F]"
                >
                  Login
                </button>

                {/* ✅ CART with counter + redirect to cart */}
                <Link href="/website/cart" className="relative hover:text-[#82008F]">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#82008F] text-white text-[10px] font-semibold flex items-center justify-center leading-none">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* CENTER: SEARCH */}
            <div className="flex md:flex-1 md:justify-center">
              <div className="w-full md:max-w-[640px]">
                <div className="h-11 sm:h-12 flex items-center rounded-full border border-gray-300 bg-gray-50 px-4 shadow-sm focus-within:border-[#82008F] focus-within:ring-2 focus-within:ring-[#82008F]/20">
                  <Search className="h-5 w-5 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Try Saree, Kurti or Search by Product Code"
                    className="ml-3 w-full bg-transparent text-[14px] sm:text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: DESKTOP ACTIONS */}
            <div className="hidden md:flex items-center gap-6 text-[15px] font-medium text-gray-700">
              <button
                onClick={() => {
                  setMode("login");
                  setShowAuth(true);
                }}
                className="hover:text-[#82008F]"
              >
                Login
              </button>

              {/* ✅ CART with counter + redirect to cart */}
              {CartIconWithBadge}
            </div>
          </div>
        </div>
      </header>

      {/* ================= AUTH POPUP ================= */}
      {showAuth && (
        <div className="fixed inset-0 z-999 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl relative">

            {/* Close */}
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <X />
            </button>

            <div className="px-8 py-7">
              <h2 className="text-2xl font-semibold text-center text-gray-900">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h2>

              <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                {mode === "login"
                  ? "Login to continue shopping"
                  : "Join us and start shopping today"}
              </p>

              <form className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#82008F]/30 focus:border-[#82008F]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#82008F]/30 focus:border-[#82008F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#82008F]/30 focus:border-[#82008F]"
                  />
                </div>

                {mode === "login" && (
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-xs text-[#82008F] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="w-full mt-2 rounded-lg bg-[#82008F] py-2.5 text-white text-sm font-semibold hover:bg-[#6f007a] transition"
                >
                  {mode === "login" ? "Login" : "Create Account"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="px-3 text-xs text-gray-400">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Toggle */}
              <div className="text-center text-sm text-gray-600">
                {mode === "login" ? (
                  <>
                    New to Mechkart?{" "}
                    <button
                      onClick={() => setMode("signup")}
                      className="text-[#82008F] font-semibold hover:underline"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("login")}
                      className="text-[#82008F] font-semibold hover:underline"
                    >
                      Login
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
