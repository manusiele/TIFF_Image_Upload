const sharp = require("sharp");

/**
 * POST /api/convert
 * Body: { image: "<base64 PNG string>" }
 * Response: TIFF binary file download
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { image } = req.body;

    if (!image) {
      res.status(400).json({ error: "No image data provided" });
      return;
    }

    // Strip the data URL prefix if present (e.g. "data:image/png;base64,")
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Decode base64 string into a raw buffer
    const inputBuffer = Buffer.from(base64Data, "base64");

    // Convert PNG buffer → TIFF buffer using sharp (lossless)
    const tiffBuffer = await sharp(inputBuffer)
      .tiff({ compression: "lzw" }) // lossless LZW compression
      .toBuffer();

    // Send TIFF binary as a downloadable file
    res.setHeader("Content-Type", "image/tiff");
    res.setHeader("Content-Disposition", 'attachment; filename="capture.tiff"');
    res.setHeader("Content-Length", tiffBuffer.length);
    res.status(200).send(tiffBuffer);
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).json({ error: "Failed to convert image to TIFF" });
  }
};
