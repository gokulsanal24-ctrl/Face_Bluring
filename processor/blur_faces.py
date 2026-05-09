import argparse
import json
import os
import sys

import cv2


def fail(message, code=1):
    print(json.dumps({"error": message}), file=sys.stderr)
    sys.exit(code)


def blur_faces(input_path, output_path, cascade_path):
    if not os.path.exists(input_path):
        fail("Input image was not found.")

    if not os.path.exists(cascade_path):
        fail("Face detector XML file was not found.")

    image = cv2.imread(input_path, cv2.IMREAD_COLOR)
    if image is None:
        fail("Uploaded file could not be read as an image.")

    detector = cv2.CascadeClassifier(cascade_path)
    if detector.empty():
        fail("Face detector XML file could not be loaded.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

    faces = detector.detectMultiScale(
        gray,
        scaleFactor=1.08,
        minNeighbors=5,
        minSize=(35, 35),
        flags=cv2.CASCADE_SCALE_IMAGE,
    )

    for (x, y, w, h) in faces:
        pad_x = max(4, int(w * 0.08))
        pad_y = max(4, int(h * 0.10))

        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(image.shape[1], x + w + pad_x)
        y2 = min(image.shape[0], y + h + pad_y)

        face_region = image[y1:y2, x1:x2]
        if face_region.size == 0:
            continue

        kernel_w = max(45, ((x2 - x1) // 2) * 2 + 1)
        kernel_h = max(45, ((y2 - y1) // 2) * 2 + 1)
        blurred = cv2.GaussianBlur(face_region, (kernel_w, kernel_h), 30)
        image[y1:y2, x1:x2] = blurred

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    success = cv2.imwrite(output_path, image, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    if not success:
        fail("Could not save the processed image.")

    return len(faces)


def main():
    parser = argparse.ArgumentParser(description="Detect and blur faces in an image with OpenCV.")
    parser.add_argument("--input", required=True, help="Path to uploaded input image.")
    parser.add_argument("--output", required=True, help="Path where the blurred image should be saved.")
    parser.add_argument("--cascade", required=True, help="Path to haarcascade_frontalface_default.xml.")
    args = parser.parse_args()

    try:
        faces_detected = blur_faces(args.input, args.output, args.cascade)
        print(json.dumps({"facesDetected": faces_detected}))
    except Exception as error:
        fail(str(error))


if __name__ == "__main__":
    main()
