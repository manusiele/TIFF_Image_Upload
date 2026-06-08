const loading      = document.getElementById("loading");
const notFound     = document.getElementById("not-found");
const viewGrid     = document.getElementById("view-grid");
const imgFront     = document.getElementById("img-front");
const imgBack      = document.getElementById("img-back");
const subtitle     = document.getElementById("subtitle");
const errorMsg     = document.getElementById("error-msg");
const btnDlFront   = document.getElementById("btn-dl-front");
const btnDlBack    = document.getElementById("btn-dl-back");
const dlStatusFront = document.getElementById("dl-status-front");
const dlStatusBack  = document.getElementById("dl-status-back");

// Holds the raw base64 data URLs after load so download can use them
let images = { front: null, back: null };

// Extract slug from URL path: /view/<slug>
const slug = window.location.pathname.split("/").filter(Boolean).pop();

if (!slug) {
  showNotFound();
} else {
  loadImages(slug);
}

// ── Load images from API ──────────────────────────────────────────────────────

async function loadImages(slug) {
  try {
    const response = await fetch(`/api/view/${slug}`);

    if (response.status === 404) {
      showNotFound();
      return;
    }

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    // Store for download use
    images.front = data.frontImage;
    images.back  = data.backImage;

    imgFront.src = data.frontImage;
    imgBack.src  = data.backImage;

    const created = new Date(data.createdAt);
    subtitle.textContent = `Captured on ${created.toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric"
    })}`;

    loading.classList.add("hidden");
    viewGrid.classList.remove("hidden");
  } catch (err) {
    loading.classList.add("hidden");
    errorMsg.textContent = `Failed to load images: ${err.message}`;
    errorMsg.classList.remove("hidden");
  }
}

function showNotFound() {
  loading.classList.add("hidden");
  notFound.classList.remove("hidden");
  subtitle.textContent = "";
}

// ── Download as TIFF ──────────────────────────────────────────────────────────

async function downloadTiff(side) {
  const imageData = images[side];
  if (!imageData) return;

  const btn       = side === "front" ? btnDlFront : btnDlBack;
  const statusEl  = side === "front" ? dlStatusFront : dlStatusBack;
  const filename  = `id-${side}.tiff`;

  btn.disabled = true;
  statusEl.textContent = "Converting…";
  statusEl.className = "dl-status dl-status--loading";

  try {
    const response = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement("a");
    link.href     = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    statusEl.textContent = "Downloaded!";
    statusEl.className = "dl-status dl-status--success";
    setTimeout(() => { statusEl.textContent = ""; statusEl.className = "dl-status"; }, 3000);
  } catch (err) {
    statusEl.textContent = `Failed: ${err.message}`;
    statusEl.className = "dl-status dl-status--error";
  } finally {
    btn.disabled = false;
  }
}

btnDlFront.addEventListener("click", () => downloadTiff("front"));
btnDlBack.addEventListener("click",  () => downloadTiff("back"));
