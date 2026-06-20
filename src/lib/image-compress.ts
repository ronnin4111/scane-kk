/**
 * Utility kompresi & resize gambar di client-side sebelum upload ke API OCR.
 *
 * Quality presets:
 * - "medium" (default): 1920px, q88 — balance akurasi & ukuran (~250-400KB)
 * - "high": 2560px, q92 — untuk teks kecil / sulit dibaca
 * - "original": no resize, q92 — kirim apa adanya (bisa >1MB)
 */

export type CompressQuality = "medium" | "high" | "original";

interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp";
  preset?: CompressQuality;
}

const PRESETS: Record<CompressQuality, { maxDimension: number; quality: number }> = {
  medium: { maxDimension: 1920, quality: 0.88 },
  high: { maxDimension: 2560, quality: 0.92 },
  original: { maxDimension: 99999, quality: 0.92 },
};

export async function compressImage(
  source: string | File | Blob,
  options: CompressOptions = {},
): Promise<{
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  preset: CompressQuality;
}> {
  const preset = options.preset ?? "medium";
  const presetConfig = PRESETS[preset];

  const {
    maxDimension = presetConfig.maxDimension,
    quality = presetConfig.quality,
    mimeType = "image/jpeg",
  } = options;

  let sourceDataUrl: string;
  let originalSize: number;

  if (typeof source === "string") {
    sourceDataUrl = source;
    const base64Part = source.split(",")[1] ?? "";
    originalSize = Math.floor((base64Part.length * 3) / 4);
  } else {
    originalSize = source.size;
    sourceDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  }

  const img = await loadImage(sourceDataUrl);

  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context tidak tersedia");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const compressedDataUrl = canvas.toDataURL(mimeType, quality);
  const compressedBase64 = compressedDataUrl.split(",")[1] ?? "";
  const compressedSize = Math.floor((compressedBase64.length * 3) / 4);

  return {
    dataUrl: compressedDataUrl,
    originalSize,
    compressedSize,
    width,
    height,
    preset,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal load gambar"));
    img.src = src;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
