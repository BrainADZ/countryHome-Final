"use client";

import { useState } from "react";

type Filters = {
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  sort: "relevance" | "price_low" | "price_high" | "newest";
};

export default function ProductFilters({
  onApply,
  onReset,
}: {
  onApply?: (filters: Filters) => void;
  onReset?: () => void;
}) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<Filters["sort"]>("relevance");

  const handleApply = () => {
    onApply?.({ minPrice, maxPrice, inStockOnly, sort });
  };

  const handleReset = () => {
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSort("relevance");
    onReset?.();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-24 w-full">
      <h2 className="text-sm font-semibold text-gray-900">Filters</h2>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Price</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Availability</p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            In Stock Only
          </label>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Sort</p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Filters["sort"])}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="relevance">Relevance</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        <button
          onClick={handleApply}
          className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:opacity-95"
        >
          Apply
        </button>

        <button
          onClick={handleReset}
          className="w-full px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
