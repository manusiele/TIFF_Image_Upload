const loading    = document.getElementById("loading");
const notFound   = document.getElementById("not-found");
const main       = document.getElementById("main");
const imgFront   = document.getElementById("img-front");
const imgBack    = document.getElementById("img-back");
const pageMeta   = document.getElementById("page-meta");
const btnFront   = document.getElementById("btn-dl-front");
const btnBack    = document.getElementById("btn-dl-back");

let images = { front: null, back: null };

const slug = window.location.pathname.split("/").filter(Boolean).pop();
slug ? loadImages(slug) : showNotFound();

// ── Load ──────────────────────────────────────────────────────────────────────

async function loadImages(slug) {
  try {
    const res = await fetch(`/api/view/${slug}`);
    if (res.status === 404) { showNotFound(); return; }
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    images.front = data.frontImage;
    images.back  = data.backImage;

    imgFront.src = data.frontImage;
    imgBack.src  = data.backImage;

    const d = new Date(data.createdAt);
    pageMeta.textContent = `Captured ${d.toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric"
    })} · Expires in 7 days`;

    loading.classList.add("hidden");
    main.classList.remove("hidden");
  } catch (err) {
    loading.classList.add("hidden");
    showNotFound();
  }
}

function showNotFound() {
  loading.classList.add("hidden");
  notFound.classList.remove("hidden");
}

// ── Download TIFF ─────────────────────────────────────────────────────────────

async function downloadTiff(side) {
  const btn      = side === "front" ? btnFront : btnBack;
  const imageData = images[side];
  if (!imageData || btn.disabled) return;

  const filename = `id-${side}.tiff`;

  // Loading state
  btn.disabled = true;
  btn.classList.add("loading");
  btn.textContent = "";

  try {
    const res = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || `Error ${res.status}`);
    }

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Success state
    btn.classList.remove("loading");
    btn.classList.add("done");
    btn.textContent = "SAVED ✓";
    setTimeout(() => {
      btn.classList.remove("done");
      btn.textContent = "DOWNLOAD";
      btn.disabled = false;
    }, 2500);

  } catch (err) {
    btn.classList.remove("loading");
    btn.classList.add("error");
    btn.textContent = "FAILED";
    setTimeout(() => {
      btn.classList.remove("error");
      btn.textContent = "DOWNLOAD";
      btn.disabled = false;
    }, 2500);
  }
}

btnFront.addEventListener("click", () => downloadTiff("front"));
btnBack.addEventListener("click",  () => downloadTiff("back"));
