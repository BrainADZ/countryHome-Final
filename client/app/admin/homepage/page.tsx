/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type ApiCategory = {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: ApiCategory | string | null;
};

type PickType = "category" | "subcategory";

type DealPick = {
  type: PickType;
  id: string;
};

type DealSection = {
  key: "top_picks" | "section_2";
  title?: string;
  picks: DealPick[];
};

type DealsConfig = {
  isActive: boolean;
  sections: DealSection[];
};

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
};

const authHeaders = (): Record<string, string> => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const isSubCategory = (c: ApiCategory) => !!c?.parentCategory;

const normalizeSections = (cfg?: DealsConfig | null): DealsConfig => {
  const base: DealsConfig = {
    isActive: true,
    sections: [
      { key: "top_picks", title: "Top picks of the sale", picks: [] },
      { key: "section_2", title: "Winter Essentials for You", picks: [] },
    ],
  };

  if (!cfg) return base;

  const top = cfg.sections?.find((s) => s.key === "top_picks") || base.sections[0];
  const sec2 = cfg.sections?.find((s) => s.key === "section_2") || base.sections[1];

  return {
    isActive: cfg.isActive !== false,
    sections: [
      { key: "top_picks", title: "Top picks of the sale", picks: (top.picks || []).slice(0, 4) },
      { key: "section_2", title: (sec2.title || base.sections[1].title)!, picks: (sec2.picks || []).slice(0, 4) },
    ],
  };
};

export default function HomeDealsAdminPage() {
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [cfg, setCfg] = useState<DealsConfig>(() => normalizeSections(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // ---- options list ----
  const options = useMemo(() => {
    const parents = cats.filter((c) => !c.parentCategory);
    const subs = cats.filter((c) => !!c.parentCategory);

    parents.sort((a, b) => a.name.localeCompare(b.name));
    subs.sort((a, b) => a.name.localeCompare(b.name));

    return {
      parents,
      subs,
      // combined for easy lookup
      byId: cats.reduce((acc: Record<string, ApiCategory>, c) => {
        acc[c._id] = c;
        return acc;
      }, {}),
    };
  }, [cats]);

  // ---- load categories + existing config ----
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setMsg("");
        if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL missing");

        const [catRes, cfgRes] = await Promise.all([
          fetch(`${API_BASE}/admin/categories`, {
            cache: "no-store",
            headers: { ...authHeaders() },
          }),
          fetch(`${API_BASE}/admin/home-deals`, {
            cache: "no-store",
            headers: { ...authHeaders() },
          }),
        ]);

        const catData = await catRes.json();
        const cfgData = await cfgRes.json();

        const catList: ApiCategory[] = catData?.data || catData?.categories || [];
        setCats(Array.isArray(catList) ? catList : []);

        const existing: DealsConfig | null = cfgData?.data
          ? {
              isActive: cfgData.data.isActive !== false,
              sections: cfgData.data.sections || [],
            }
          : null;

        setCfg(normalizeSections(existing));
      } catch (e: any) {
        setMsg(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  // ---- helpers to update state ----
  const setSectionTitle = (title: string) => {
    setCfg((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.key === "section_2" ? { ...s, title } : s
      ),
    }));
  };

  const setPickAt = (sectionKey: DealSection["key"], index: number, value: string) => {
    // value format: "none" OR "category:<id>" OR "subcategory:<id>"
    setCfg((prev) => {
      const next = { ...prev };
      const sec = next.sections.find((x) => x.key === sectionKey);
      if (!sec) return prev;

      const picks = [...(sec.picks || [])];
      while (picks.length < 4) picks.push({ type: "category", id: "" });

      if (value === "none") {
        picks[index] = { type: "category", id: "" };
      } else {
        const [t, id] = value.split(":");
        const type = (t === "subcategory" ? "subcategory" : "category") as PickType;
        picks[index] = { type, id };
      }

      // remove empty picks at end when saving later; but keep 4 slots UI
      sec.picks = picks.slice(0, 4);
      next.sections = next.sections.map((s) => (s.key === sectionKey ? sec : s));
      return next;
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      setMsg("");
      if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL missing");

      const top = cfg.sections.find((s) => s.key === "top_picks")!;
      const sec2 = cfg.sections.find((s) => s.key === "section_2")!;

      const cleanPicks = (picks: DealPick[]) =>
        (picks || [])
          .filter((p) => p?.id)
          .slice(0, 4)
          .map((p) => ({ type: p.type, id: p.id }));

      const payload = {
        isActive: cfg.isActive,
        sections: [
          { key: "top_picks", picks: cleanPicks(top.picks) },
          { key: "section_2", title: sec2.title || "Featured Categories", picks: cleanPicks(sec2.picks) },
        ],
      };

      const res = await fetch(`${API_BASE}/admin/home-deals`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Save failed");

      setCfg(normalizeSections(data?.data || null));
      setMsg("✅ Saved successfully");
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ---- UI: one section card ----
  const SectionCard = ({
    sectionKey,
    titleFixed,
  }: {
    sectionKey: DealSection["key"];
    titleFixed?: boolean;
  }) => {
    const sec = cfg.sections.find((s) => s.key === sectionKey)!;

    // ensure 4 slots
    const picks = [...(sec.picks || [])];
    while (picks.length < 4) picks.push({ type: "category", id: "" });

    const displayTitle =
      sectionKey === "top_picks" ? "Top picks of the sale" : (sec.title || "");

    return (
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">
              {sectionKey === "top_picks" ? "Section 1" : "Section 2"}
            </h2>

            {titleFixed ? (
              <p className="mt-1 text-sm text-slate-600">
                Title: <span className="font-medium">{displayTitle}</span> (fixed)
              </p>
            ) : (
              <div className="mt-3">
                <label className="text-sm text-slate-700">Section Title</label>
                <input
                  value={displayTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Enter section title"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Pick any 4 tiles</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {picks.slice(0, 4).map((p, idx) => {
            const value = p.id ? `${p.type}:${p.id}` : "none";
            const pickedCat = p.id ? options.byId[p.id] : null;

            return (
              <div key={idx} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-800">
                    Tile {idx + 1}
                  </div>
                  {pickedCat ? (
                    <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                      {isSubCategory(pickedCat) ? "Subcategory" : "Category"}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Not selected</span>
                  )}
                </div>

                <select
                  className="mt-2 w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  value={value}
                  onChange={(e) => setPickAt(sectionKey, idx, e.target.value)}
                >
                  <option value="none">-- Select Category / Subcategory --</option>

                  <optgroup label="Categories">
                    {options.parents.map((c) => (
                      <option key={c._id} value={`category:${c._id}`}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Subcategories">
                    {options.subs.map((c) => (
                      <option key={c._id} value={`subcategory:${c._id}`}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {pickedCat ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Slug: <span className="font-medium">{pickedCat.slug}</span>
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Home Deals Manager</h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure homepage deals tiles (Category/Subcategory mix).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={cfg.isActive}
              onChange={(e) => setCfg((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Active
          </label>

          <button
            disabled={loading || saving}
            onClick={save}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {msg ? (
        <div className="mt-4 text-sm">
          <div className="border rounded-lg px-4 py-3 bg-slate-50 text-slate-800">
            {msg}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 text-sm text-slate-600">Loading...</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6">
          <SectionCard sectionKey="top_picks" titleFixed />
          <SectionCard sectionKey="section_2" />
        </div>
      )}
    </div>
  );
}
