const loading   = document.getElementById("loading");
const notFound  = document.getElementById("not-found");
const viewGrid  = document.getElementById("view-grid");
const imgFront  = document.getElementById("img-front");
const imgBack   = document.getElementById("img-back");
const subtitle  = document.getElementById("subtitle");
const errorMsg  = document.getElementById("error-msg");

// Extract slug from URL path: /view/<slug>
const slug = window.location.pathname.split("/").filter(Boolean).pop();

if (!slug) {
  showNotFound();
} else {
  loadImages(slug);
}

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

    imgFront.src = data.frontImage;
    imgBack.src  = data.backImage;

    // Format created date
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
