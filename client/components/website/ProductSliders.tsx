/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard"; // ✅ use your universal card

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ✅ using your existing endpoint
const PRODUCTS_ENDPOINT = `${API_BASE}/admin/products`;

function Slider({ title, products }: { title: string; products: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (offset: number) => {
    if (scrollRef.current)
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="w-full bg-[#f7fafd] py-8">
      <div className="max-w-[1700px] mx-auto px-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-bold text-[#003366]">{title}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => scroll(-900)}
              className="p-2 bg-white border border-[#d6e5ea] rounded-full shadow-sm hover:bg-[#e6f7fa] transition"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} className="text-[#003366]" />
            </button>
            <button
              onClick={() => scroll(900)}
              className="p-2 bg-white border border-[#d6e5ea] rounded-full shadow-sm hover:bg-[#e6f7fa] transition"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} className="text-[#003366]" />
            </button>
          </div>
        </div>

        {/* Slider */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth scrollbar-hide pb-3"
        >
          {products.map((p, i) => (
            <div key={p?._id || i} className="flex-none w-[260px]">
              {/* ✅ universal product card (clickable) */}
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProductSliders() {
  const [latestProducts, setLatestProducts] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        if (!API_BASE) {
          setLatestProducts([]);
          return;
        }

        const res = await fetch(PRODUCTS_ENDPOINT, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load latest products");
        const data = await res.json();

        const list: any[] = data?.data || data?.products || [];
        if (!Array.isArray(list) || list.length === 0) {
          setLatestProducts([]);
          return;
        }

        /**
         * ✅ FIXED LOGIC:
         * 1) Sort all products by newest
         * 2) Pick last 10 days
         * 3) If not enough (e.g. no new products for 20 days), backfill with older newest products
         * 4) Always return up to 12 products
         */
        const DESIRED_COUNT = 12;

        const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
        const cutoff = Date.now() - TEN_DAYS_MS;

        // sort all by createdAt desc
        const sorted = list
          .filter((p) => p?.createdAt || p?.created_at)
          .sort((a, b) => {
            const A = new Date(a?.createdAt || a?.created_at || 0).getTime();
            const B = new Date(b?.createdAt || b?.created_at || 0).getTime();
            return B - A;
          });

        // primary: last 10 days
        const recent = sorted.filter((p) => {
          const created = new Date(p?.createdAt || p?.created_at || 0).getTime();
          return created && created >= cutoff;
        });

        // start with recent
        let finalList = [...recent];

        // backfill if needed
        if (finalList.length < DESIRED_COUNT) {
          const needed = DESIRED_COUNT - finalList.length;

          const older = sorted.filter(
            (p) => !finalList.some((x) => x?._id === p?._id)
          );

          finalList = finalList.concat(older.slice(0, needed));
        }

        // final cap
        finalList = finalList.slice(0, DESIRED_COUNT);

        setLatestProducts(finalList);
      } catch {
        setLatestProducts([]);
      }
    };

    run();
  }, []);

  if (latestProducts.length === 0) return null;

  return (
    <>
      <Slider title="Latest Products" products={latestProducts} />
      <div className="h-px bg-[#e4edf1] mx-auto max-w-[1700px]" />
    </>
  );
}
