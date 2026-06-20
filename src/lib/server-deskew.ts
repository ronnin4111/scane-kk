/**
 * Server-side Auto-Deskew Utility
 * Menggunakan sharp untuk image processing di server Next.js API route.
 */

import sharp from "sharp";

interface DeskewResult {
  deskewedBuffer: Buffer;
  deskewedDataUrl: string;
  detectedAngle: number;
  confidence: number;
  corrected: boolean;
}

export async function estimateSkewServer(
  imageBuffer: Buffer,
  options: {
    minAngle?: number;
    maxAngle?: number;
    coarseStep?: number;
    fineStep?: number;
  } = {},
): Promise<{ angle: number; confidence: number }> {
  const { minAngle = -25, maxAngle = 25, coarseStep = 2, fineStep = 0.5 } = options;

  const smallBuffer = await sharp(imageBuffer)
    .resize(300, 300, { fit: "inside", withoutEnlargement: true })
    .greyscale()
    .raw()
    .toBuffer();

  const meta = await sharp(smallBuffer).metadata();
  const w = meta.width ?? 300;
  const h = meta.height ?? 300;

  let bestAngle = 0;
  let bestScore = -Infinity;
  const scores: Array<{ angle: number; score: number }> = [];

  for (let angle = minAngle; angle <= maxAngle; angle += coarseStep) {
    const score = await calculateProjectionScoreServer(smallBuffer, w, h, angle);
    scores.push({ angle, score });
    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }

  const fineMin = Math.max(minAngle, bestAngle - coarseStep);
  const fineMax = Math.min(maxAngle, bestAngle + coarseStep);
  for (let angle = fineMin; angle <= fineMax; angle += fineStep) {
    const score = await calculateProjectionScoreServer(smallBuffer, w, h, angle);
    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }

  const meanScore = scores.reduce((s, x) => s + x.score, 0) / scores.length;
  const confidence =
    bestScore > 0 ? Math.min(1, (bestScore - meanScore) / bestScore) : 0;

  return { angle: bestAngle, confidence };
}

async function calculateProjectionScoreServer(
  buffer: Buffer,
  w: number,
  h: number,
  angleDeg: number,
): Promise<number> {
  try {
    const rotated = await sharp(buffer, {
      raw: { width: w, height: h, channels: 1 },
    })
      .rotate(angleDeg, { background: { r: 255, g: 255, b: 255 } })
      .raw()
      .toBuffer();

    const meta = await sharp(rotated).metadata();
    const rw = meta.width ?? w;
    const rh = meta.height ?? h;

    const profile = new Float32Array(rh);
    for (let i = 0; i < rotated.length; i++) {
      const x = i % rw;
      const y = Math.floor(i / rw);
      if (rotated[i] < 128) {
        profile[y] += 1;
      }
    }

    let sum = 0;
    for (let i = 0; i < rh; i++) sum += profile[i];
    const mean = sum / rh;
    let variance = 0;
    for (let i = 0; i < rh; i++) {
      const diff = profile[i] - mean;
      variance += diff * diff;
    }
    variance /= rh;

    return variance;
  } catch (err) {
    console.error(`[Server Deskew] Score calc error for angle ${angleDeg}:`, err);
    return 0;
  }
}

export async function deskewImageServer(
  imageDataUrl: string,
  options?: {
    minConfidence?: number;
    minAngleToCorrect?: number;
  },
): Promise<DeskewResult> {
  const { minConfidence = 0.02, minAngleToCorrect = 0.5 } = options ?? {};

  // Handle berbagai format data URL (image/png, image/jpeg, image/webp, dll)
  const match = imageDataUrl.match(/^data:image\/[a-z+]+;base64,(.+)$/i);
  if (!match) throw new Error("Format data URL tidak valid");
  const originalBuffer = Buffer.from(match[1], "base64");

  console.log("[Server Deskew] Starting skew estimation...");
  const estimationStart = Date.now();

  const { angle, confidence } = await estimateSkewServer(originalBuffer);
  console.log(
    `[Server Deskew] Detected angle: ${angle.toFixed(2)}°, confidence: ${confidence.toFixed(3)}, took ${Date.now() - estimationStart}ms`,
  );

  if (confidence < minConfidence || Math.abs(angle) < minAngleToCorrect) {
    return {
      deskewedBuffer: originalBuffer,
      deskewedDataUrl: imageDataUrl,
      detectedAngle: angle,
      confidence,
      corrected: false,
    };
  }

  const deskewedBuffer = await sharp(originalBuffer)
    .rotate(-angle, { background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 90 })
    .toBuffer();

  const deskewedBase64 = deskewedBuffer.toString("base64");
  const deskewedDataUrl = `data:image/jpeg;base64,${deskewedBase64}`;

  return {
    deskewedBuffer,
    deskewedDataUrl,
    detectedAngle: angle,
    confidence,
    corrected: true,
  };
}
