# Face Blur Detection Web Application

A complete web app for uploading an image, detecting faces with OpenCV in Python, applying Gaussian blur to every detected face, previewing the result, and downloading the blurred image.

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js and Express
- Image processing: Python and OpenCV
- Node to Python bridge: `child_process.spawn`
- Face detector: `haarcascade_frontalface_default.xml` from the project root

## Folder Structure

```text
Face_Bluring/
├── haarcascade_frontalface_default.xml
├── server.js
├── package.json
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── processor/
│   ├── blur_faces.py
│   └── requirements.txt
├── uploads/
│   └── .gitkeep
├── outputs/
│   └── .gitkeep
├── .gitignore
└── README.md
```

## Setup

Install Node dependencies:

```bash
npm install
```

Install Python dependencies:

```bash
pip install -r processor/requirements.txt
```

If your system uses `python3` instead of `python`, start the app with:

```bash
PYTHON_COMMAND=python3 npm start
```

On Windows PowerShell:

```powershell
$env:PYTHON_COMMAND="python"; npm start
```

## Run

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Deploy on Render

Use these settings if you create the Render service manually:

```text
Environment: Node
Build Command: npm install && python3 -m pip install -r processor/requirements.txt
Start Command: npm start
Environment Variable: PYTHON_COMMAND=python3
```

The included `render.yaml` contains the same settings for blueprint-style deployment.

## Features

- Upload JPG, PNG, and WEBP images
- Original image preview
- Gaussian blur on all detected faces
- Multiple face detection
- Blurred output preview
- Download button for the processed image
- Loading animation while processing
- Responsive modern UI
- Clean backend error handling
- GitHub-friendly project structure

## Notes

The Python script reads `haarcascade_frontalface_default.xml` directly from the project root through an argument supplied by the Node.js backend. Uploaded images are stored temporarily in `uploads/`, processed images are served from `outputs/`, and both runtime folders are ignored by Git except for their `.gitkeep` placeholders.
