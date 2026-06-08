const loading  = document.getElementById("loading");
const notFound = document.getElementById("not-found");
const main     = document.getElementById("main");
const imgFront = document.getElementById("img-front");
const imgBack  = document.getElementById("img-back");
const pageMeta = document.getElementById("page-meta");
const deck     = document.getElementById("deck");
const dot0     = document.getElementById("dot-0");
const dot1     = document.getElementById("dot-1");
const btnPrev  = document.getElementById("btn-prev");
const btnNext  = document.getElementById("btn-next");
const btnDlFront = document.getElementById("btn-dl-front");
const btnDlBack  = document.getElementById("btn-dl-back");

let images  = { front: null, back: null };
let current = 0; // 0 = front, 1 = back

// ── Boot ──────────────────────────────────────────────────────────────────────
const slug = window.location.pathname.split("/").filter(Boolean).pop();
slug ? loadImages(slug) : showNotFound();

// ── Fetch images ──────────────────────────────────────────────────────────────
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
    pageMeta.textContent = d.toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric"
    });

    loading.classList.add("hidden");
    main.classList.remove("hidden");
    goTo(0); // start on page 1
  } catch {
    loading.classList.add("hidden");
    showNotFound();
  }
}

function showNotFound() {
  loading.classList.add("hidden");
  notFound.classList.remove("hidden");
}

// ── Pagination ────────────────────────────────────────────────────────────────
function goTo(page) {
  current = page;

  deck.classList.toggle("page-2", page === 1);
  deck.classList.toggle("page-1", page === 0);

  // Dots
  dot0.classList.toggle("active", page === 0);
  dot1.classList.toggle("active", page === 1);

  // Nav buttons
  btnPrev.disabled = page === 0;
  btnNext.disabled = page === 1;

  // Style next button on last page
  if (page === 1) {
    btnNext.textContent = "Last page";
  } else {
    btnNext.textContent = "Next →";
  }
}

btnNext.addEventListener("click", () => { if (current < 1) goTo(current + 1); });
btnPrev.addEventListener("click", () => { if (current > 0) goTo(current - 1); });

// Touch/swipe support
let touchStartX = 0;
document.addEventListener("touchstart", e => { touchStartX = e.touches[0].clientX; }, { passive: true });
document.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 50) return;
  if (dx < 0 && current === 0) goTo(1); // swipe left → next
  if (dx > 0 && current === 1) goTo(0); // swipe right → prev
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
