const { neon } = require("@neondatabase/serverless");

// Generate a random URL-safe slug (12 characters)
function generateSlug() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let slug = "";
  for (let i = 0; i < 12; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

/**
 * POST /api/upload
 * Body: { frontImage: "<base64 data URL>", backImage: "<base64 data URL>" }
 * Response: { slug: "xK9mP2qR..." }
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { frontImage, backImage } = req.body;

    if (!frontImage || !backImage) {
      return res.status(400).json({ error: "Both frontImage and backImage are required" });
    }

    // Basic validation — must be data URLs
    if (!frontImage.startsWith("data:image/") || !backImage.startsWith("data:image/")) {
      return res.status(400).json({ error: "Images must be base64 data URLs" });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Generate a unique slug (retry once on collision — extremely unlikely)
    let slug = generateSlug();
    const existing = await sql`SELECT id FROM captures WHERE slug = ${slug}`;
    if (existing.length > 0) {
      slug = generateSlug();
    }

    await sql`
      INSERT INTO captures (slug, front_image, back_image)
      VALUES (${slug}, ${frontImage}, ${backImage})
    `;

    return res.status(200).json({ slug });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Failed to save images" });
  }
};
