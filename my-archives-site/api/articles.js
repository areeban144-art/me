// Vercel serverless function: reads the public Substack archive and returns the list the site displays.
// Categories = the post's Substack tags (so #film becomes Film) plus any lines in categories.json.
// Slugs listed in hidden.json never appear on the site.
// Add ?debug=1 to the address to see the raw tags Substack sends.
const categories = require("../categories.json");
const hidden = require("../hidden.json");

const BASE = "https://areebasarchives.substack.com";
const PAGE = 50;

const KNOWN = {
  "film": "Film",
  "films": "Film",
  "feminism": "Feminism",
  "people people": "People People",
  "people-people": "People People",
  "life & people": "Life & People",
  "life and people": "Life & People",
};

function normalize(name) {
  const clean = String(name || "").replace(/^#+/, "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const known = KNOWN[clean.toLowerCase()];
  if (known) return known;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

module.exports = async function handler(req, res) {
  try {
    let all = [];
    for (let offset = 0, i = 0; i < 20; i += 1, offset += PAGE) {
      const r = await fetch(`${BASE}/api/v1/archive?sort=new&limit=${PAGE}&offset=${offset}`, {
        headers: { "user-agent": "my-archives-site", accept: "application/json" },
      });
      if (!r.ok) throw new Error(`Substack returned ${r.status}`);
      const page = await r.json();
      if (!Array.isArray(page) || page.length === 0) break;
      all = all.concat(page);
      if (page.length < PAGE) break;
    }

    if (req.query && req.query.debug) {
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(
        all.map((p) => ({ slug: p.slug, title: p.title, audience: p.audience, tags: p.postTags, section: p.section_name }))
      );
      return;
    }

    const posts = all
      .filter((p) => p.canonical_url && p.title && !hidden.includes(p.slug))
      .map((p) => {
        const fromTags = (p.postTags || [])
          .map((t) => (typeof t === "string" ? t : t && (t.name || t.slug)))
          .map(normalize)
          .filter(Boolean);
        const fromFile = [].concat(categories[p.slug] || []).map(normalize).filter(Boolean);
        const merged = Array.from(new Set(fromTags.concat(fromFile)));
        return {
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle || "",
          date: p.post_date,
          url: p.canonical_url,
          cover: p.cover_image || "",
          w: 1200,
          h: 675,
          category: merged,
        };
      });

    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json(posts);
  } catch (err) {
    res.status(502).json({ error: "Could not reach Substack", detail: String(err.message || err) });
  }
};
