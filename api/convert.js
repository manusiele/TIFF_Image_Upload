const sharp = require("sharp");

/**
 * POST /api/convert
 * Body: { image: "<base64 PNG string>" }
 * Response: TIFF binary file download (300 DPI, LZW, print-ready for Photoshop)
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

    // Diagnostic: catch truncated/empty buffers early
    console.log("Received buffer size:", inputBuffer.length, "bytes");
    if (inputBuffer.length < 1000) {
      res.status(400).json({
        error: `Image buffer too small (${inputBuffer.length} bytes) — likely truncated by body size limit`,
      });
      return;
    }

    // Convert PNG buffer → print-ready TIFF (300 DPI, LZW lossless)
    const tiffBuffer = await sharp(inputBuffer)
      .tiff({
        compression: "lzw",
        predictor: "horizontal", // better compression for photos
        resolutionUnit: "inch",
        xres: 300,               // 300 DPI — print/Photoshop quality
        yres: 300,
      })
      .toBuffer();

    console.log("TIFF output size:", tiffBuffer.length, "bytes");

    // Send TIFF binary as a downloadable file
    res.setHeader("Content-Type", "image/tiff");
    res.setHeader("Content-Disposition", 'attachment; filename="capture.tiff"');
    res.setHeader("Content-Length", tiffBuffer.length);
    res.status(200).send(tiffBuffer);

  } catch (err) {
    console.error("Conversion error:", err.message);

    if (err.message.includes("Input buffer contains unsupported image format")) {
      res.status(400).json({ error: "Invalid image data — could not decode PNG" });
    } else if (err.message.includes("memory")) {
      res.status(500).json({ error: "Image too large to process — try a lower resolution" });
    } else {
      res.status(500).json({ error: `Conversion failed: ${err.message}` });
    }
  }
};

// Increase Vercel body parser limit from default 4.5MB to 20MB
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};
