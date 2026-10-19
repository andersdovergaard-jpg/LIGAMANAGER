export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  // Try multiple slug variants and URL patterns
  const slugVariants = [slug];

  // Known alternative slugs for leagues ESPN may list differently
  const altSlugs = {
    "pol.1": ["pol.1", "pol.ekstraklasa"],
    "den.2": ["den.2", "den.1div", "dk.2"],
  };
  if (altSlugs[slug]) {
    slugVariants.push(...altSlugs[slug].filter(s => s !== slug));
  }

  for (const s of slugVariants) {
    const urls = [
      `https://site.api.espn.com/apis/v2/sports/soccer/${s}/standings`,
      `https://site.web.api.espn.com/apis/v2/sports/soccer/${s}/standings?lang=en&region=gb`,
      `https://site.api.espn.com/apis/v2/sports/soccer/${s}/standings?season=2025`,
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });
        if (!r.ok) continue;
        const data = await r.json();

        // Try multiple data paths ESPN uses
        const entries =
          data?.standings?.entries ||
          data?.children?.[0]?.standings?.entries ||
          data?.children?.[0]?.children?.[0]?.standings?.entries ||
          data?.groups?.[0]?.standings?.entries ||
          [];

        const teams = entries
          .map(e => e.team?.displayName || e.team?.name)
          .filter(Boolean);

        if (teams.length > 0) {
          return res.status(200).json({ teams, slug: s, url });
        }
      } catch (e) {
        continue;
      }
    }
  }

  return res.status(200).json({ teams: [], slug, tried: slugVariants });
}
