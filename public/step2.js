const video        = document.getElementById("video");
const canvas       = document.getElementById("canvas");
const placeholder  = document.getElementById("placeholder");
const previewWrap  = document.getElementById("preview-wrapper");
const preview      = document.getElementById("preview");
const btnStart     = document.getElementById("btn-start");
const btnCapture   = document.getElementById("btn-capture");
const btnRetake    = document.getElementById("btn-retake");
const btnSubmit    = document.getElementById("btn-submit");
const shareBox     = document.getElementById("share-box");
const shareUrl     = document.getElementById("share-url");
const btnCopy      = document.getElementById("btn-copy");
const errorMsg     = document.getElementById("error-msg");
const statusMsg    = document.getElementById("status-msg");

let capturedImage = null;

// Guard: must have front image from step 1
const frontImage = sessionStorage.getItem("frontImage");
if (!frontImage) {
  window.location.href = "index.html";
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
  statusMsg.classList.add("hidden");
}
function showStatus(msg) {
  statusMsg.textContent = msg;
  statusMsg.classList.remove("hidden");
  errorMsg.classList.add("hidden");
}
function clearMessages() {
  errorMsg.classList.add("hidden");
  statusMsg.classList.add("hidden");
}

// Start camera
btnStart.addEventListener("click", async () => {
  clearMessages();
  btnStart.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = stream;
    video.style.display = "block";
    placeholder.style.display = "none";
    btnCapture.disabled = false;
    btnStart.textContent = "Camera On";
  } catch (err) {
    btnStart.disabled = false;
    if (err.name === "NotAllowedError") {
      showError("Camera permission denied. Please allow camera access and try again.");
    } else if (err.name === "NotFoundError") {
      showError("No camera found on this device.");
    } else {
      showError(`Could not start camera: ${err.message}`);
    }
  }
});

// Capture frame
btnCapture.addEventListener("click", () => {
  clearMessages();
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  capturedImage = canvas.toDataURL("image/jpeg", 0.92);

  preview.src = capturedImage;
  previewWrap.classList.remove("hidden");
  video.style.display = "none";

  btnCapture.classList.add("hidden");
  btnStart.classList.add("hidden");
  btnRetake.classList.remove("hidden");
  btnSubmit.classList.remove("hidden");

  showStatus("Back captured. Click Generate Link to upload.");
});

// Retake
btnRetake.addEventListener("click", () => {
  clearMessages();
  capturedImage = null;
  previewWrap.classList.add("hidden");
  video.style.display = "block";

  btnRetake.classList.add("hidden");
  btnSubmit.classList.add("hidden");
  btnCapture.classList.remove("hidden");
  btnStart.classList.remove("hidden");
});

// Upload both images and get shareable URL
btnSubmit.addEventListener("click", async () => {
  if (!capturedImage || !frontImage) return;

  btnSubmit.disabled = true;
  btnRetake.disabled = true;
  showStatus("Uploading images…");

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frontImage,
        backImage: capturedImage,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    const { slug } = await response.json();
    const url = `${window.location.origin}/view/${slug}`;

    // Show share box
    shareUrl.value = url;
    shareBox.classList.remove("hidden");
    statusMsg.classList.add("hidden");

    // Clear sessionStorage — done with it
    sessionStorage.removeItem("frontImage");
  } catch (err) {
    showError(`Upload failed: ${err.message}`);
    btnSubmit.disabled = false;
    btnRetake.disabled = false;
  }
});

// Copy to clipboard
btnCopy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    btnCopy.textContent = "Copied!";
    btnCopy.classList.add("copied");
    setTimeout(() => {
      btnCopy.textContent = "Copy";
      btnCopy.classList.remove("copied");
    }, 2000);
  } catch {
    // Fallback for browsers that block clipboard API
    shareUrl.select();
    document.execCommand("copy");
    btnCopy.textContent = "Copied!";
    setTimeout(() => { btnCopy.textContent = "Copy"; }, 2000);
  }
});
