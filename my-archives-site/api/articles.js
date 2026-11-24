// Vercel serverless function: reads the public Substack archive and returns the list the site displays.
// Category comes from a Substack post tag if the post has one, otherwise from categories.json (slug -> category).
const categories = require("../categories.json");

const BASE = "https://areebasarchives.substack.com";
const PAGE = 50;

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

    const posts = all
      .filter((p) => p.canonical_url && p.title)
      .map((p) => {
        const tags = (p.postTags || []).map((t) => (typeof t === "string" ? t : t && t.name)).filter(Boolean);
        return {
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle || "",
          date: p.post_date,
          url: p.canonical_url,
          cover: p.cover_image || "",
          w: 1200,
          h: 675,
          category: tags.length ? tags : categories[p.slug] || "",
        };
      });

    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
    res.status(200).json(posts);
  } catch (err) {
    res.status(502).json({ error: "Could not reach Substack", detail: String(err.message || err) });
  }
};
