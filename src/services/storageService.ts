import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { isFirebaseConfigured, storage } from "./firebase";
import type { CropMeta } from "../types";

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fileToCompressedDataUrl(
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<string> {
  const source = await fileToDataUrl(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("無法建立圖片壓縮畫布。"));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => reject(new Error("圖片讀取失敗，請換一張再試。"));
    image.src = source;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("圖片讀取失敗，請換一張圖片再試。"));
    image.src = source;
  });
}

export async function dataUrlToCroppedDataUrl(
  source: string,
  crop: CropMeta,
  maxDimension = 1600,
  quality = 0.9
): Promise<string> {
  const image = await loadImage(source);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const normalizedCrop = {
    x: clamp(crop.x, 0, 100),
    y: clamp(crop.y, 0, 100),
    width: clamp(crop.width, 1, 100),
    height: clamp(crop.height, 1, 100),
  };
  const sx = Math.round((normalizedCrop.x / 100) * sourceWidth);
  const sy = Math.round((normalizedCrop.y / 100) * sourceHeight);
  const sw = Math.max(
    1,
    Math.min(sourceWidth - sx, Math.round((normalizedCrop.width / 100) * sourceWidth))
  );
  const sh = Math.max(
    1,
    Math.min(sourceHeight - sy, Math.round((normalizedCrop.height / 100) * sourceHeight))
  );
  const scale = Math.min(1, maxDimension / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("無法建立圖片裁切畫布，請重新整理後再試。");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function fileToCroppedDataUrl(
  file: File,
  crop: CropMeta,
  maxDimension = 1600,
  quality = 0.9
): Promise<string> {
  const source = await fileToDataUrl(file);
  return dataUrlToCroppedDataUrl(source, crop, maxDimension, quality);
}

export async function uploadQuestionImage(input: {
  userId: string;
  childId: string;
  questionId: string;
  file: File;
  onProgress?: (progress: number) => void;
}) {
  if (!isFirebaseConfigured || !storage || input.userId === "demo_user") {
    input.onProgress?.(100);
    return fileToDataUrl(input.file);
  }

  const storageRef = ref(
    storage,
    `users/${input.userId}/children/${input.childId}/questions/${input.questionId}/original-${input.file.name}`
  );
  const uploadTask = uploadBytesResumable(storageRef, input.file);

  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        input.onProgress?.(progress);
      },
      reject,
      async () => {
        resolve(await getDownloadURL(uploadTask.snapshot.ref));
      }
    );
  });
}
