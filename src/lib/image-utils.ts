/**
 * Image Utilities CLIENT-SIDE untuk KK Scanner
 * Berisi fungsi rotate & deskew (projection profile method).
 * JANGAN import sharp atau module Node.js lain di file ini!
 */

export async function loadImage(
  src: string,
): Promise<{
  width: number;
  height: number;
  element: HTMLImageElement;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight, element: img });
    img.onerror = () => reject(new Error("Gagal load gambar"));
    img.src = src;
  });
}

export async function rotateImage(
  sourceDataUrl: string,
  degrees: number,
  backgroundColor = "#ffffff",
): Promise<string> {
  const { element: img, width, height } = await loadImage(sourceDataUrl);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context tidak tersedia");

  const rad = (degrees * Math.PI) / 180;
  const absSin = Math.abs(Math.sin(rad));
  const absCos = Math.abs(Math.cos(rad));
  canvas.width = Math.ceil(width * absCos + height * absSin);
  canvas.height = Math.ceil(width * absSin + height * absCos);

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -width / 2, -height / 2);

  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function estimateSkew(
  sourceDataUrl: string,
  options: {
    minAngle?: number;
    maxAngle?: number;
    coarseStep?: number;
    fineStep?: number;
  } = {},
): Promise<{ angle: number; confidence: number }> {
  const { minAngle = -30, maxAngle = 30, coarseStep = 2, fineStep = 0.5 } = options;

  const { element: img, width: origW, height: origH } = await loadImage(sourceDataUrl);

  const maxDim = 400;
  const scale = Math.min(1, maxDim / Math.max(origW, origH));
  const w = Math.round(origW * scale);
  const h = Math.round(origH * scale);

  const binaryData = preprocessForSkewDetection(img, w, h);

  let bestAngle = 0;
  let bestScore = -Infinity;
  for (let angle = minAngle; angle <= maxAngle; angle += coarseStep) {
    const score = calculateProjectionScore(binaryData, w, h, angle);
    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }

  const fineMin = Math.max(minAngle, bestAngle - coarseStep);
  const fineMax = Math.min(maxAngle, bestAngle + coarseStep);
  for (let angle = fineMin; angle <= fineMax; angle += fineStep) {
    const score = calculateProjectionScore(binaryData, w, h, angle);
    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }

  const scoreAt0 = calculateProjectionScore(binaryData, w, h, 0);
  const confidence =
    bestScore > 0 ? Math.min(1, (bestScore - scoreAt0) / bestScore) : 0;

  return { angle: bestAngle, confidence };
}

function preprocessForSkewDetection(
  img: HTMLImageElement,
  w: number,
  h: number,
): Uint8Array {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context tidak tersedia");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const gray = new Uint8Array(w * h);
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    gray[i] = lum;
    histogram[lum]++;
  }

  const total = w * h;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];
  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  const binary = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    binary[i] = gray[i] < threshold ? 1 : 0;
  }

  return binary;
}

function calculateProjectionScore(
  binary: Uint8Array,
  w: number,
  h: number,
  angleDeg: number,
): number {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const newW = Math.ceil(Math.abs(w * cos) + Math.abs(h * sin));
  const newH = Math.ceil(Math.abs(w * sin) + Math.abs(h * cos));
  const cx = w / 2;
  const cy = h / 2;
  const newCx = newW / 2;
  const newCy = newH / 2;

  const profile = new Float32Array(newH);
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const dx = x - newCx;
      const dy = y - newCy;
      const origX = Math.round(cx + dx * cos + dy * sin);
      const origY = Math.round(cy - dx * sin + dy * cos);
      if (origX >= 0 && origX < w && origY >= 0 && origY < h) {
        if (binary[origY * w + origX] === 1) {
          profile[y] += 1;
        }
      }
    }
  }

  let sum = 0;
  for (let i = 0; i < newH; i++) sum += profile[i];
  const mean = sum / newH;
  let variance = 0;
  for (let i = 0; i < newH; i++) {
    const diff = profile[i] - mean;
    variance += diff * diff;
  }
  variance /= newH;

  return variance;
}

export async function deskewImage(
  sourceDataUrl: string,
  options?: {
    minAngle?: number;
    maxAngle?: number;
    minConfidence?: number;
    minAngleToCorrect?: number;
  },
): Promise<{
  deskewedDataUrl: string;
  detectedAngle: number;
  confidence: number;
  corrected: boolean;
}> {
  const {
    minAngle = -30,
    maxAngle = 30,
    minConfidence = 0.05,
    minAngleToCorrect = 0.5,
  } = options ?? {};

  const { angle, confidence } = await estimateSkew(sourceDataUrl, {
    minAngle,
    maxAngle,
  });

  console.log(
    `[Client Deskew] Detected angle: ${angle.toFixed(2)}°, confidence: ${confidence.toFixed(3)}`,
  );

  if (confidence < minConfidence || Math.abs(angle) < minAngleToCorrect) {
    return {
      deskewedDataUrl: sourceDataUrl,
      detectedAngle: angle,
      confidence,
      corrected: false,
    };
  }

  const deskewedDataUrl = await rotateImage(sourceDataUrl, -angle);

  return {
    deskewedDataUrl,
    detectedAngle: angle,
    confidence,
    corrected: true,
  };
}
