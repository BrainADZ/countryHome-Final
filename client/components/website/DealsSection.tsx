/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type ApiCategory = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  parentCategory?: ApiCategory | string | null;
};

type ApiVariant = {
  mrp?: number;
  salePrice?: number;
};

type ApiProduct = {
  _id: string;
  mrp?: number;
  salePrice?: number;
  variants?: ApiVariant[];

  category?: any;
  categoryId?: any;
  subCategory?: any;
  subCategoryId?: any;
};

// ✅ deals config types (from /common/home-deals)
type DealPick = { type: "category" | "subcategory"; id: string };
type DealSection = { key: "top_picks" | "section_2"; title?: string; picks: DealPick[] };
type DealsConfig = { isActive: boolean; sections: DealSection[] };

// image resolver
const resolveImageUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const apiBase = API_BASE || "";
  const host = apiBase.replace(/\/api\/?$/, "");
  if (path.startsWith("/")) return `${host}${path}`;
  return `${host}/${path}`;
};

// ---------- discount helpers ----------
const toNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const calcDiscountPercent = (mrp: number, sale: number) => {
  if (!mrp || mrp <= 0) return 0;
  if (!sale || sale <= 0) return 0;
  if (sale >= mrp) return 0;
  return Math.round(((mrp - sale) / mrp) * 100);
};

const getProductDiscount = (p: ApiProduct) => {
  const vars = Array.isArray(p.variants) ? p.variants : [];
  let best = 0;

  for (const v of vars) {
    const mrp = toNum(v?.mrp);
    const sale = toNum(v?.salePrice);
    if (!mrp || !sale) continue;
    const d = calcDiscountPercent(mrp, sale);
    if (d > best) best = d;
  }

  if (best === 0) {
    const mrp = toNum(p?.mrp);
    const sale = toNum(p?.salePrice);
    if (mrp && sale) best = calcDiscountPercent(mrp, sale);
  }

  return best;
};

// ✅ returns "best id" used to bucket discounts (subcategory first, then category)
const getProductBucketCategoryId = (p: ApiProduct): string => {
  const pickId = (x: any) => {
    if (!x) return "";
    if (typeof x === "string") return x;
    if (typeof x === "object" && x._id) return String(x._id);
    return "";
  };

  return (
    pickId(p.subCategoryId) ||
    pickId(p.subCategory) ||
    pickId(p.categoryId) ||
    pickId(p.category) ||
    ""
  );
};

export default function DealsSection() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [dealsConfig, setDealsConfig] = useState<DealsConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ fetch categories + products + dealsConfig
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        if (!API_BASE) return;

        const [catRes, prodRes, dealsRes] = await Promise.all([
          fetch(`${API_BASE}/admin/categories`, { cache: "no-store" }),
          fetch(`${API_BASE}/admin/products`, { cache: "no-store" }),
          fetch(`${API_BASE}/common/home-deals`, { cache: "no-store" }),

        ]);

        const catData = await catRes.json();
        const prodData = await prodRes.json();
        const dealsData = await dealsRes.json();

        const catList: ApiCategory[] = catData?.data || catData?.categories || [];
        const prodList: ApiProduct[] = prodData?.data || prodData?.products || [];

        setCategories(Array.isArray(catList) ? catList : []);
        setProducts(Array.isArray(prodList) ? prodList : []);

        // dealsData.data => {isActive, sections:[{key,title,picks:[{type,id}]}]}
        const cfg = dealsData?.data;
        setDealsConfig(cfg?.sections ? cfg : null);
      } catch {
        setCategories([]);
        setProducts([]);
        setDealsConfig(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  // ✅ category lookup map
  const categoryById = useMemo(() => {
    const m: Record<string, ApiCategory> = {};
    for (const c of categories) if (c?._id) m[c._id] = c;
    return m;
  }, [categories]);

  // ✅ avg discount map by bucket category id (sub OR parent)
  const avgDiscountMap = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};

    for (const p of products) {
      const bucketId = getProductBucketCategoryId(p);
      if (!bucketId) continue;

      const d = getProductDiscount(p);
      if (d <= 0) continue;

      if (!map[bucketId]) map[bucketId] = { sum: 0, count: 0 };
      map[bucketId].sum += d;
      map[bucketId].count += 1;
    }

    const out: Record<string, number> = {};
    for (const k of Object.keys(map)) {
      out[k] = map[k].count ? Math.round(map[k].sum / map[k].count) : 0;
    }
    return out;
  }, [products]);

  const isSubCategory = (c?: ApiCategory | null) => !!c?.parentCategory;

  const getParentSlugForSub = (sub: ApiCategory) => {
    if (!sub.parentCategory) return "";
    const pid =
      typeof sub.parentCategory === "string"
        ? sub.parentCategory
        : sub.parentCategory?._id;

    const parent = pid ? categoryById[pid] : null;
    return (
      parent?.slug ||
      (typeof sub.parentCategory === "object" ? sub.parentCategory.slug : "") ||
      ""
    );
  };

  // ✅ build href from pick type + category document
  const buildHref = (pick: DealPick, cat: ApiCategory) => {
    // If admin says subcategory OR the category actually has parent => treat as subcategory
    if (pick.type === "subcategory" || isSubCategory(cat)) {
      const parentSlug = getParentSlugForSub(cat);
      return parentSlug ? `/category/${parentSlug}/${cat.slug}` : `/category/${cat.slug}`;
    }
    // category
    return `/category/${cat.slug}`;
  };

  // ✅ build sections from admin config
  const deals = useMemo(() => {
    if (!dealsConfig?.isActive) return [];

    const sections = Array.isArray(dealsConfig.sections) ? dealsConfig.sections : [];

    const top = sections.find((s) => s.key === "top_picks");
    const sec2 = sections.find((s) => s.key === "section_2");

    const buildItems = (sec?: DealSection | null) => {
      const picks = sec?.picks || [];
      // keep only valid 4
      return picks.slice(0, 4).map((p) => {
        const cat = categoryById[p.id];
        const avg = avgDiscountMap[p.id] || 0;

        return {
          name: cat?.name || "—",
          img: cat?.image ? resolveImageUrl(cat.image) : "/tshirt.webp",
          offer: avg > 0 ? `Min. ${avg}% Off` : "New Range",
          offerType: avg > 0 ? "discount" : "new",
          href: cat ? buildHref(p, cat) : "/category",
        };
      });
    };

    const topItems = buildItems(top);
    const sec2Items = buildItems(sec2);

    return [
      { title: "Top picks of the sale", products: topItems },
      { title: sec2?.title || "Featured Categories", products: sec2Items },
    ];
  }, [dealsConfig, categoryById, avgDiscountMap]);

  // if config missing, you can optionally hide section
  if (!dealsConfig?.isActive) return null;

  return (
    <section className="w-full bg-[#E6F7FA] py-4">
      <div className="max-w-[1700px] mx-auto flex flex-col lg:flex-row gap-2 px-4">
        {/* Left side - Deals Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
          {deals.map((deal, idx) => (
            <div key={idx} className="bg-white border border-[#dcecf0] p-5 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-semibold text-[#003366]">{deal.title}</h3>
                <ChevronRight className="text-[#0077B6]" size={20} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(loading && deal.products.length === 0 ? new Array(4).fill(null) : deal.products).map(
                  (p: any, i: number) => {
                    if (!p) {
                      return (
                        <div
                          key={i}
                          className="border border-[#e4eff2] rounded-sm overflow-hidden bg-white"
                        >
                          <div className="relative w-full h-36 bg-gray-50" />
                          <div className="text-center py-2">
                            <div className="h-4 bg-gray-100 mx-4 rounded" />
                            <div className="h-3 bg-gray-100 mx-10 mt-2 rounded" />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={i}
                        href={p.href}
                        className="rounded-xl border border-[#e4eff2] bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group block overflow-hidden"
                      >
                        <div className="relative w-full h-48 bg-[#f7fbfd] flex items-center justify-center p-3">
                          <img
                            src={p.img}
                            alt={p.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
                          />

                          {/* subtle fade */}
                          <div className="absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-white/95 to-transparent" />
                        </div>

                        <div className="px-3 py-3 text-center">
                          <p className="text-[15px] font-semibold text-[#002B5B] truncate">
                            {p.name}
                          </p>

                          <p
                            className={`mt-1 text-[13px] font-bold ${p.offerType === "new" ? "text-[#00B4D8]" : "text-green-600"
                              }`}
                          >
                            {p.offer}
                          </p>
                        </div>
                      </Link>

                    );
                  }
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right side - Promo Banner (UNCHANGED) */}
        <div className="w-full lg:w-[360px] flex flex-col overflow-hidden bg-[#003366] text-white shadow-[0_2px_12px_rgba(0,0,0,0.1)]">

          <div className="p-10 flex flex-col items-center text-center">
            <h2 className="text-3xl font-semibold mb-3 leading-snug">
              Shop your <span className="text-[#00B4D8]">fashion</span> Needs
            </h2>
            <p className="text-[#d3e7ff] mb-8 text-[15px]">with Latest &amp; Trendy Choices</p>
            <Link
              href="/products"
              className="bg-[#00B4D8] hover:bg-[#009ec4] text-white px-7 py-3 rounded-lg font-medium transition"
            >
              Shop Now
            </Link>
          </div>
          <div className="w-full">
            <img src="/bedsheet.jpg" alt="Shop Fashion" className="object-cover w-full h-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
