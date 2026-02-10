/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Brand = {
  _id: string;
  name: string;
  image: string; // "/uploads/xxx.png"
  sortOrder: number;
  isActive: boolean;
};

const RAW_BASE = process.env.NEXT_PUBLIC_API_URL || "";
// allowed:
// - http://localhost:5000
// - http://localhost:5000/api

// ✅ API base should end with /api
const API_BASE = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

// ✅ Origin base should NOT have /api (for /uploads)
const ORIGIN_BASE = RAW_BASE.replace(/\/api\/?$/, "");

const absAssetUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ORIGIN_BASE}${path}`; // ✅ http://localhost:5000 + /uploads/...
};

export default function BrandCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch brands from API (public)
  useEffect(() => {
    let mounted = true;

    const fetchBrands = async () => {
      try {
        setLoading(true);

        // ✅ IMPORTANT: according to your server routes
        // publicBrands is inside common router => /api/common/brands
        const res = await fetch(`${API_BASE}/common/brands`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load brands");

        if (mounted) {
          const list = (data?.brands || []) as Brand[];
          list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          setBrands(list);
        }
      } catch (e) {
        if (mounted) setBrands([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBrands();
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Smooth infinite scroll animation
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let x = 0;
    let rafId = 0;
    const speed = 0.4;

    const animate = () => {
      if (!paused) {
        x -= speed;

        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0 && Math.abs(x) >= halfWidth) x = 0;

        track.style.transform = `translateX(${x}px)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [paused, brands.length]);

  if (!loading && brands.length === 0) return null;

  const loopBrands = brands.length > 0 ? [...brands, ...brands] : [];

  return (
    <section className="w-full bg-[#f7f0ff] py-10 overflow-hidden">
      <div className="max-w-[1700px] mx-auto px-6">
        <h2 className="text-2xl font-bold text-[#003366] mb-6">
          Popular Brands on Country Home
        </h2>

        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div ref={trackRef} className="flex gap-6 w-max will-change-transform">
            {loading
              ? Array.from({ length: 10 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-none w-[180px] h-[100px] bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#ece4fa]"
                  >
                    <div className="w-[120px] h-[60px] bg-gray-100 rounded animate-pulse" />
                  </div>
                ))
              : loopBrands.map((brand, idx) => (
                  <div
                    key={`${brand._id}-${idx}`}
                    className="flex-none w-[180px] h-[100px] bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#ece4fa] hover:shadow-md transition-all"
                  >
                    <Image
                      src={absAssetUrl(brand.image)} // ✅ FIXED (no /api)
                      alt={brand.name}
                      width={120}
                      height={80}
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                ))}
          </div>
        </div>

        {/* Debug (remove later) */}
        <div className="mt-3 text-[11px] text-gray-500">
          RAW: <span className="font-mono">{RAW_BASE || "(missing)"}</span>{" "}
          | API: <span className="font-mono">{API_BASE}</span>{" "}
          | ORIGIN: <span className="font-mono">{ORIGIN_BASE}</span>{" "}
          | Count: {brands.length}
        </div>
      </div>
    </section>
  );
}
