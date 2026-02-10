// app/website/products/page.tsx
import ProductsGridWithFilters from "@/components/website/ProductsGridWithFilters";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type ApiVariant = {
  _id?: string;
  mrp?: number;
  salePrice?: number;
  quantity?: number;
  images?: string[];
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

async function fetchAllProducts(): Promise<ApiProduct[]> {
  if (!API_BASE) return [];
  const res = await fetch(`${API_BASE}/admin/products?active=true`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || []) as ApiProduct[];
}

export default async function AllProductsPage() {
  const products = await fetchAllProducts();

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-900">All Products</h1>

      {/* ✅ client does filtering */}
      <ProductsGridWithFilters products={products} />
    </div>
  );
}
