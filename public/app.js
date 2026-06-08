const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const placeholder = document.getElementById("placeholder");
const btnStart = document.getElementById("btn-start");
const btnCapture = document.getElementById("btn-capture");
const errorMsg = document.getElementById("error-msg");
const statusMsg = document.getElementById("status-msg");

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Step 2: Start Camera ──────────────────────────────────────────────────────

btnStart.addEventListener("click", async () => {
  clearMessages();
  btnStart.disabled = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }, // prefer rear camera on mobile
      audio: false,
    });

    video.srcObject = stream;
    video.style.display = "block";
    placeholder.style.display = "none";

    btnCapture.disabled = false;
    btnStart.textContent = "Camera On";
  } catch (err) {
    btnStart.disabled = false;

    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      showError("Camera permission denied. Please allow camera access and try again.");
    } else if (err.name === "NotFoundError") {
      showError("No camera found on this device.");
    } else {
      showError(`Could not start camera: ${err.message}`);
    }
  }
});

// ── Step 3 + 4 + 7: Capture → Convert → Download ─────────────────────────────

btnCapture.addEventListener("click", async () => {
  clearMessages();
  btnCapture.disabled = true;
  showStatus("Capturing frame…");

  // Draw current video frame onto hidden canvas
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Export canvas as base64 PNG
  const base64Image = canvas.toDataURL("image/png");

  showStatus("Converting to TIFF…");

  try {
    // POST to serverless function
    const response = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    // Receive TIFF binary blob
    const blob = await response.blob();

    // Trigger browser download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "capture.tiff";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showStatus("Download started — open capture.tiff in Photoshop.");
  } catch (err) {
    showError(`Conversion failed: ${err.message}`);
  } finally {
    btnCapture.disabled = false;
  }
});
