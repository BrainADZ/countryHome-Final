import { Request, Response } from "express";
import HomeDeals from "../../models/HomeDeals.model";

// Ensure single config doc exists
const ensureDoc = async () => {
  let doc = await HomeDeals.findOne({});
  if (!doc) doc = await HomeDeals.create({});
  return doc;
};

// sanitize pick
const sanitizePick = (p: any) => {
  const type = p?.type === "category" ? "category" : "subcategory";
  const id = p?.id; // should be ObjectId string from client
  return { type, id };
};

// sanitize section
const sanitizeSection = (s: any) => {
  const key = String(s?.key || "").trim();
  const title = typeof s?.title === "string" ? s.title.trim() : undefined;
  const picks = Array.isArray(s?.picks) ? s.picks.map(sanitizePick).slice(0, 4) : [];
  return { key, title, picks };
};

/**
 * ✅ ADMIN: Get current home deals config
 * GET /admin/home-deals
 */
export const getHomeDealsAdmin = async (_req: Request, res: Response) => {
  const doc = await ensureDoc();
  return res.json({ success: true, data: doc });
};

/**
 * ✅ ADMIN: Update home deals config
 * PUT /admin/home-deals
 * body:
 * {
 *  isActive: true,
 *  sections: [
 *    { key:"top_picks", picks:[{type,id}...] },
 *    { key:"section_2", title:"...", picks:[{type,id}...] }
 *  ]
 * }
 */
export const updateHomeDealsAdmin = async (req: Request, res: Response) => {
  const doc = await ensureDoc();

  const incomingSections = Array.isArray(req.body?.sections) ? req.body.sections : [];
  const cleaned = incomingSections.map(sanitizeSection);

  // pick out the 2 sections
  const top = cleaned.find((x) => x.key === "top_picks") || {
    key: "top_picks",
    title: "Top picks of the sale",
    picks: [],
  };

  const sec2 = cleaned.find((x) => x.key === "section_2") || {
    key: "section_2",
    title: "Winter Essentials for You",
    picks: [],
  };

  // enforce title rule
  top.title = "Top picks of the sale"; // fixed title
  sec2.title = (sec2.title || "Featured Categories").trim();

  // hard limit max 4
  top.picks = (top.picks || []).slice(0, 4);
  sec2.picks = (sec2.picks || []).slice(0, 4);

  // set active
  if (typeof req.body?.isActive === "boolean") {
    doc.isActive = req.body.isActive;
  }

  doc.sections = [top, sec2];

  await doc.save();

  return res.json({ success: true, data: doc });
};

/**
 * ✅ PUBLIC (Website): Get config for homepage
 * GET /common/home-deals
 */
export const getHomeDealsPublic = async (_req: Request, res: Response) => {
  const doc = await ensureDoc();

  // send only minimal fields
  return res.json({
    success: true,
    data: {
      isActive: doc.isActive !== false,
      sections: (doc.sections || []).map((s: any) => ({
        key: s.key,
        title: s.title,
        picks: (s.picks || []).map((p: any) => ({
          type: p.type,
          id: String(p.id),
        })),
      })),
    },
  });
};
