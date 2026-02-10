"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/website/ProductCard";
import ProductFilters from "@/components/website/ProductFilter";

type ApiVariant = {
  _id?: string;
  mrp?: number;
  salePrice?: number;
  quantity?: number;
};

type ApiProduct = {
  _id: string;
  title: string;
  slug: string;
  featureImage?: string;
  mrp?: number;
  salePrice?: number;
  baseStock?: number;
  variants?: ApiVariant[];
};

function calcTotalStock(p: ApiProduct) {
  if (p.variants && p.variants.length > 0) {
    return p.variants.reduce((sum, v) => sum + Number(v.quantity ?? 0), 0);
  }
  return Number(p.baseStock ?? 0);
}

function getEffectivePrice(p: ApiProduct) {
  // ✅ prefer salePrice, else mrp, else 0
  const sp = Number(p.salePrice ?? 0);
  const mrp = Number(p.mrp ?? 0);
  return sp > 0 ? sp : mrp > 0 ? mrp : 0;
}

type Filters = {
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  sort: "relevance" | "price_low" | "price_high" | "newest";
};

export default function ProductsGridWithFilters({
  products,
}: {
  products: ApiProduct[];
}) {
  const [filters, setFilters] = useState<Filters>({
    minPrice: "",
    maxPrice: "",
    inStockOnly: false,
    sort: "relevance",
  });

  const filtered = useMemo(() => {
    let list = [...products];

    // availability
    if (filters.inStockOnly) {
      list = list.filter((p) => calcTotalStock(p) > 0);
    }

    // price range
    const min = filters.minPrice ? Number(filters.minPrice) : null;
    const max = filters.maxPrice ? Number(filters.maxPrice) : null;

    if (min !== null && !Number.isNaN(min)) {
      list = list.filter((p) => getEffectivePrice(p) >= min);
    }
    if (max !== null && !Number.isNaN(max)) {
      list = list.filter((p) => getEffectivePrice(p) <= max);
    }

    // sort
    if (filters.sort === "price_low") {
      list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    }
    if (filters.sort === "price_high") {
      list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    }
    // newest: if you have createdAt, sort by that. Otherwise keep as is.

    return list;
  }, [products, filters]);

  return (
    <div className="mt-5 flex flex-col md:flex-row gap-6 items-start">
      <aside className="w-full md:w-[280px] shrink-0">
        <ProductFilters
          onApply={(f) => setFilters(f)}
          onReset={() =>
            setFilters({
              minPrice: "",
              maxPrice: "",
              inStockOnly: false,
              sort: "relevance",
            })
          }
        />
      </aside>

      <section className="flex-1 w-full">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-600">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => {
              const totalStock = calcTotalStock(p);
              return (
                <ProductCard
                  key={p._id}
                  product={{
                    _id: p._id,
                    title: p.title,
                    slug: p.slug,
                    featureImage: p.featureImage,
                    mrp: p.mrp,
                    salePrice: p.salePrice,
                    variants: p.variants || [],
                    totalStock,
                    inStock: totalStock > 0,
                  }}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
