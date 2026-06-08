const video        = document.getElementById("video");
const canvas       = document.getElementById("canvas");
const placeholder  = document.getElementById("placeholder");
const previewWrap  = document.getElementById("preview-wrapper");
const preview      = document.getElementById("preview");
const btnStart     = document.getElementById("btn-start");
const btnCapture   = document.getElementById("btn-capture");
const btnRetake    = document.getElementById("btn-retake");
const btnNext      = document.getElementById("btn-next");
const errorMsg     = document.getElementById("error-msg");
const statusMsg    = document.getElementById("status-msg");

let capturedImage = null;

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

  // Show preview, hide live feed + camera wrapper
  preview.src = capturedImage;
  previewWrap.classList.remove("hidden");
  document.getElementById("camera-wrapper").classList.add("hidden");

  // Swap buttons
  btnCapture.classList.add("hidden");
  btnStart.classList.add("hidden");
  btnRetake.classList.remove("hidden");
  btnNext.classList.remove("hidden");

  showStatus("Front captured. Click Next to continue.");
});

// Retake
btnRetake.addEventListener("click", () => {
  clearMessages();
  capturedImage = null;
  previewWrap.classList.add("hidden");
  document.getElementById("camera-wrapper").classList.remove("hidden");
  video.style.display = "block";

  btnRetake.classList.add("hidden");
  btnNext.classList.add("hidden");
  btnCapture.classList.remove("hidden");
  btnStart.classList.remove("hidden");
});

// Next — save image to sessionStorage and go to step 2
btnNext.addEventListener("click", () => {
  if (!capturedImage) return;
  sessionStorage.setItem("frontImage", capturedImage);
  window.location.href = "/step2.html";
});
