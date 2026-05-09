const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT_DIR = __dirname;
const UPLOAD_DIR = path.join(ROOT_DIR, "uploads");
const OUTPUT_DIR = path.join(ROOT_DIR, "outputs");
const PROCESSOR_PATH = path.join(ROOT_DIR, "processor", "blur_faces.py");
const CASCADE_PATH = path.join(ROOT_DIR, "haarcascade_frontalface_default.xml");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(ROOT_DIR, "public")));
app.use("/outputs", express.static(OUTPUT_DIR));

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP images are supported."));
    }
    cb(null, true);
  }
});

function runPythonProcessor(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const pythonCommand = process.env.PYTHON_COMMAND || "python";
    const args = [
      PROCESSOR_PATH,
      "--input",
      inputPath,
      "--output",
      outputPath,
      "--cascade",
      CASCADE_PATH
    ];

    const child = spawn(pythonCommand, args, {
      cwd: ROOT_DIR,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Could not start Python process: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `Python processor exited with code ${code}.`));
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (_error) {
        reject(new Error("Python processor returned an invalid response."));
      }
    });
  });
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/blur", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload an image file." });
  }

  const inputPath = req.file.path;
  const outputName = `blurred-${path.parse(req.file.filename).name}.jpg`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const result = await runPythonProcessor(inputPath, outputPath);

    res.json({
      message: "Image processed successfully.",
      facesDetected: result.facesDetected,
      outputUrl: `/outputs/${outputName}`
    });
  } catch (error) {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    res.status(500).json({
      error: error.message || "Image processing failed."
    });
  } finally {
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
  }
});

app.use((error, _req, res, _next) => {
  res.status(400).json({
    error: error.message || "Something went wrong."
  });
});

app.listen(PORT, () => {
  console.log(`Face Blur Detection app is running at http://localhost:${PORT}`);
});
