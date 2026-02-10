/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";

type Brand = {
  _id: string;
  name: string;
  image: string; // "/uploads/xxx.png"
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const RAW_BASE = process.env.NEXT_PUBLIC_API_URL || ""; 
// allowed examples:
// - http://localhost:5000
// - http://localhost:5000/api

// ✅ API base must end with /api
const API_BASE = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

// ✅ Asset origin must NOT include /api
const ORIGIN_BASE = RAW_BASE.replace(/\/api\/?$/, "");

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
};

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

// ✅ for /uploads/...
const absAssetUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ORIGIN_BASE}${path}`; // ✅ http://localhost:5000 + /uploads/...
};

export default function AdminBrandsPage() {
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState<string>("");

  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [editing, setEditing] = useState<Brand | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortOrder, setEditSortOrder] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  const hasApiBase = useMemo(() => !!RAW_BASE, []);

  const fetchBrands = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/brands`, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch brands");
      setBrands(data?.brands || []);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const resetCreateForm = () => {
    setName("");
    setSortOrder(0);
    setIsActive(true);
    setImageFile(null);
    const input = document.getElementById("brandImage") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setEditName(b.name);
    setEditSortOrder(b.sortOrder ?? 0);
    setEditIsActive(!!b.isActive);
    setEditImageFile(null);
    const input = document.getElementById("editBrandImage") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const closeEdit = () => {
    setEditing(null);
    setEditImageFile(null);
  };

  const createBrand = async () => {
    setError("");
    if (!name.trim()) return setError("Name is required");
    if (!imageFile) return setError("Image is required");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("sortOrder", String(sortOrder ?? 0));
      fd.append("isActive", String(isActive));
      fd.append("image", imageFile);

      const res = await fetch(`${API_BASE}/admin/brands`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create brand");

      resetCreateForm();
      await fetchBrands();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const updateBrand = async () => {
    if (!editing) return;
    setError("");
    if (!editName.trim()) return setError("Name is required");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", editName.trim());
      fd.append("sortOrder", String(editSortOrder ?? 0));
      fd.append("isActive", String(editIsActive));
      if (editImageFile) fd.append("image", editImageFile);

      const res = await fetch(`${API_BASE}/admin/brands/${editing._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update brand");

      closeEdit();
      await fetchBrands();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleBrand = async (id: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/brands/${id}/toggle`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to toggle brand");

      await fetchBrands();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const deleteBrand = async (id: string) => {
    const ok = confirm("Delete this brand? This cannot be undone.");
    if (!ok) return;

    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/brands/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete brand");

      await fetchBrands();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f6f7fb]">
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#003366]">Brands Manager</h1>
            <p className="text-sm text-gray-600 mt-1">
              Upload brand logos for the homepage carousel. Control order & visibility.
            </p>
            {!hasApiBase && (
              <p className="mt-2 text-sm text-red-600">
                NEXT_PUBLIC_API_URL missing. Example: http://localhost:5000 OR http://localhost:5000/api
              </p>
            )}
          </div>

          <button
            onClick={fetchBrands}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow transition"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Create */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#003366]">Add New Brand</h2>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Brand Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Country Home"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
              />
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4"
                />
                Active
              </label>
            </div>

            <div className="md:col-span-3">
              <label className="text-sm font-medium text-gray-700">Brand Image (logo)</label>
              <input
                id="brandImage"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="mt-1 w-full text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Tip: Transparent PNG looks best.</p>
            </div>

            <div className="md:col-span-1 flex items-end gap-3">
              <button
                onClick={createBrand}
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg bg-[#003366] text-white hover:opacity-95 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Create"}
              </button>
              <button
                onClick={resetCreateForm}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#003366]">All Brands</h2>
            <span className="text-sm text-gray-600">
              {loading ? "Loading..." : `${brands.length} brands`}
            </span>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr className="text-left text-gray-600">
                  <th className="p-4">Logo</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Order</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {brands.map((b) => (
                  <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50/60">
                    <td className="p-4">
                      <div className="w-[140px] h-[70px] bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                        <img
                          src={absAssetUrl(b.image)}   // ✅ FIXED
                          alt={b.name}
                          className="max-w-[120px] max-h-[55px] object-contain"
                        />
                      </div>
                    </td>

                    <td className="p-4 font-medium text-gray-800">{b.name}</td>
                    <td className="p-4">{b.sortOrder ?? 0}</td>

                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs border ${
                          b.isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {b.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleBrand(b._id)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Toggle
                        </button>

                        <button
                          onClick={() => openEdit(b)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteBrand(b._id)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:opacity-95 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {brands.length === 0 && !loading && (
                  <tr>
                    <td className="p-6 text-gray-600" colSpan={5}>
                      No brands found. Create your first brand above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[999]">
            <div className="w-full max-w-[700px] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Edit Brand</p>
                  <h3 className="text-lg font-semibold text-[#003366]">{editing.name}</h3>
                </div>
                <button
                  onClick={closeEdit}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Brand Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Sort Order</label>
                  <input
                    type="number"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Active
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Replace Image (optional)</label>
                  <input
                    id="editBrandImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                    className="mt-1 w-full text-sm"
                  />

                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-[160px] h-[80px] bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                      <img
                        src={absAssetUrl(editing.image)} // ✅ FIXED
                        alt={editing.name}
                        className="max-w-[140px] max-h-[60px] object-contain"
                      />
                    </div>

                    {editImageFile && (
                      <div className="text-xs text-gray-600">
                        New file selected: <span className="font-medium">{editImageFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 flex gap-3">
                  <button
                    onClick={updateBrand}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-[#003366] text-white hover:opacity-95 disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update"}
                  </button>

                  <button
                    onClick={closeEdit}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 text-xs text-gray-500">
          RAW: <span className="font-mono">{RAW_BASE || "(missing)"}</span>{" "}
          | API: <span className="font-mono">{API_BASE}</span>{" "}
          | ORIGIN: <span className="font-mono">{ORIGIN_BASE}</span>
        </div>
      </div>
    </div>
  );
}
