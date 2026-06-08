const loading     = document.getElementById("loading");
const notFound    = document.getElementById("not-found");
const pageFront   = document.getElementById("page-front");
const pageBack    = document.getElementById("page-back");
const imgFront    = document.getElementById("img-front");
const imgBack     = document.getElementById("img-back");
const metaFront   = document.getElementById("page-meta-front");
const metaBack    = document.getElementById("page-meta-back");
const btnDlFront  = document.getElementById("btn-dl-front");
const btnDlBack   = document.getElementById("btn-dl-back");
const btnNextFront = document.getElementById("btn-next-front");
const btnPrevBack  = document.getElementById("btn-prev-back");

let images = { front: null, back: null };

// ── Boot ──────────────────────────────────────────────────────────────────────
const slug = window.location.pathname.split("/").filter(Boolean).pop();
slug ? loadImages(slug) : showNotFound();

// ── Fetch ─────────────────────────────────────────────────────────────────────
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
    const label = d.toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric"
    });
    metaFront.textContent = label;
    metaBack.textContent  = label;

    loading.classList.add("hidden");
    pageFront.classList.remove("hidden");
  } catch {
    loading.classList.add("hidden");
    showNotFound();
  }
}

function showNotFound() {
  loading.classList.add("hidden");
  notFound.classList.remove("hidden");
}

// ── Navigation ────────────────────────────────────────────────────────────────
btnNextFront.addEventListener("click", () => {
  pageFront.classList.add("hidden");
  pageBack.classList.remove("hidden");
  window.scrollTo(0, 0);
});

btnPrevBack.addEventListener("click", () => {
  pageBack.classList.add("hidden");
  pageFront.classList.remove("hidden");
  window.scrollTo(0, 0);
});

// Swipe support
let tx = 0;
document.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
document.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) < 55) return;
  if (dx < 0 && !pageFront.classList.contains("hidden")) btnNextFront.click();
  if (dx > 0 && !pageBack.classList.contains("hidden"))  btnPrevBack.click();
}, { passive: true });

// ── Download TIFF ─────────────────────────────────────────────────────────────
async function downloadTiff(side) {
  const btn       = side === "front" ? btnDlFront : btnDlBack;
  const imageData = images[side];
  if (!imageData || btn.disabled) return;

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
    a.download = `id-${side}.tiff`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    btn.classList.remove("loading");
    btn.classList.add("done");
    btn.textContent = "SAVED ✓";
    setTimeout(() => {
      btn.classList.remove("done");
      btn.textContent = "DOWNLOAD";
      btn.disabled = false;
    }, 2500);

  } catch {
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

btnDlFront.addEventListener("click", () => downloadTiff("front"));
btnDlBack.addEventListener("click",  () => downloadTiff("back"));
