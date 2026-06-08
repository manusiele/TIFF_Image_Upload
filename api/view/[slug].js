const { neon } = require("@neondatabase/serverless");

/**
 * GET /api/view/[slug]
 * Response: { frontImage, backImage, createdAt }
 */
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({ error: "Slug is required" });
    }

    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT front_image, back_image, created_at
      FROM captures
      WHERE slug = ${slug}
        AND expires_at > NOW()
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: "Not found or link has expired" });
    }

    const row = rows[0];

    return res.status(200).json({
      frontImage: row.front_image,
      backImage:  row.back_image,
      createdAt:  row.created_at,
    });
  } catch (err) {
    console.error("View error:", err);
    return res.status(500).json({ error: "Failed to fetch images" });
  }
};
