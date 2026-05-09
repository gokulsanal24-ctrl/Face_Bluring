const dropZone = document.getElementById("dropZone");
const imageInput = document.getElementById("imageInput");
const browseButton = document.getElementById("browseButton");
const processButton = document.getElementById("processButton");
const downloadButton = document.getElementById("downloadButton");
const originalPreview = document.getElementById("originalPreview");
const outputPreview = document.getElementById("outputPreview");
const originalStage = document.getElementById("originalStage");
const outputStage = document.getElementById("outputStage");
const outputPlaceholder = document.getElementById("outputPlaceholder");
const loader = document.getElementById("loader");
const message = document.getElementById("message");
const statusPill = document.getElementById("statusPill");
const fileMeta = document.getElementById("fileMeta");
const faceCount = document.getElementById("faceCount");

let selectedFile = null;

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function setWorking(isWorking) {
  loader.hidden = !isWorking;
  processButton.disabled = isWorking || !selectedFile;
  statusPill.textContent = isWorking ? "Processing" : "Ready";
  statusPill.classList.toggle("working", isWorking);
}

function resetOutput() {
  outputPreview.removeAttribute("src");
  outputStage.classList.remove("has-image");
  outputStage.classList.add("empty");
  outputPlaceholder.textContent = "Processed image will appear here";
  downloadButton.removeAttribute("href");
  downloadButton.classList.add("disabled");
  faceCount.textContent = "Waiting";
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function isValidImage(file) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

function handleFile(file) {
  if (!file) return;

  if (!isValidImage(file)) {
    setMessage("Please choose a JPG, PNG, or WEBP image.", true);
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    setMessage("Image is too large. Maximum upload size is 8 MB.", true);
    return;
  }

  selectedFile = file;
  originalPreview.src = URL.createObjectURL(file);
  originalStage.classList.add("has-image");
  originalStage.classList.remove("empty");
  fileMeta.textContent = `${file.name} · ${formatBytes(file.size)}`;
  processButton.disabled = false;
  resetOutput();
  setMessage("Image ready. Click Blur Faces to process it.");
}

async function processImage() {
  if (!selectedFile) {
    setMessage("Please choose an image first.", true);
    return;
  }

  const formData = new FormData();
  formData.append("image", selectedFile);

  setWorking(true);
  setMessage("Detecting and blurring faces...");
  resetOutput();

  try {
    const response = await fetch("/api/blur", {
      method: "POST",
      body: formData
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Image processing failed.");
    }

    const cacheBustedUrl = `${payload.outputUrl}?t=${Date.now()}`;
    outputPreview.src = cacheBustedUrl;
    outputStage.classList.add("has-image");
    outputStage.classList.remove("empty");
    downloadButton.href = cacheBustedUrl;
    downloadButton.classList.remove("disabled");

    const count = payload.facesDetected;
    faceCount.textContent = `${count} ${count === 1 ? "face" : "faces"} blurred`;
    setMessage(count > 0 ? "Done. Your blurred image is ready." : "No faces were detected, but the image was processed.");
  } catch (error) {
    setMessage(error.message, true);
    faceCount.textContent = "Failed";
  } finally {
    setWorking(false);
  }
}

browseButton.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", (event) => handleFile(event.target.files[0]));
processButton.addEventListener("click", processImage);

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("drag-over");
  handleFile(event.dataTransfer.files[0]);
});
