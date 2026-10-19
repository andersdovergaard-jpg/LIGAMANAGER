export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  const urls = [
    `https://site.api.espn.com/apis/v2/sports/soccer/${slug}/standings`,
    `https://site.web.api.espn.com/apis/v2/sports/soccer/${slug}/standings?lang=en&region=gb`,
  ];

  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
      });
      if (!r.ok) continue;
      const data = await r.json();
      const entries =
        data?.standings?.entries ||
        data?.children?.[0]?.standings?.entries ||
        data?.children?.[0]?.children?.[0]?.standings?.entries ||
        [];
      const teams = entries.map(e => e.team?.displayName || e.team?.name).filter(Boolean);
      if (teams.length > 0) return res.status(200).json({ teams });
    } catch (e) { continue; }
  }

  return res.status(200).json({ teams: [] });
}
