import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { isFirebaseConfigured, storage } from "./firebase";

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
