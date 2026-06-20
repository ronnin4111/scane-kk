/**
 * Perspective Transform Utility
 *
 * Implementasi manual homography transformation untuk memperbaiki
 * foto yang distorted secara perspektif.
 */

export interface Point {
  x: number;
  y: number;
}

export interface PerspectiveCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxVal) {
        maxVal = Math.abs(M[k][i]);
        maxRow = k;
      }
    }
    if (maxRow !== i) {
      [M[i], M[maxRow]] = [M[maxRow], M[i]];
    }
    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) {
        M[k][j] -= factor * M[i][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }
  return x;
}

export function computeHomography(
  source: PerspectiveCorners,
  destination: PerspectiveCorners,
): number[][] {
  const srcPoints = [
    source.topLeft,
    source.topRight,
    source.bottomRight,
    source.bottomLeft,
  ];
  const dstPoints = [
    destination.topLeft,
    destination.topRight,
    destination.bottomRight,
    destination.bottomLeft,
  ];

  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = srcPoints[i].x;
    const sy = srcPoints[i].y;
    const dx = dstPoints[i].x;
    const dy = dstPoints[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);

    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  const h = solveLinearSystem(A, b);

  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ];
}

function invertMatrix3x3(M: number[][]): number[][] {
  const [[a, b, c], [d, e, f], [g, h, i]] = M;

  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

  if (Math.abs(det) < 1e-10) {
    throw new Error("Matrix singular, tidak bisa di-inverse");
  }

  const invDet = 1 / det;
  return [
    [(e * i - f * h) * invDet, (c * h - b * i) * invDet, (b * f - c * e) * invDet],
    [(f * g - d * i) * invDet, (a * i - c * g) * invDet, (c * d - a * f) * invDet],
    [(d * h - e * g) * invDet, (b * g - a * h) * invDet, (a * e - b * d) * invDet],
  ];
}

export async function applyPerspectiveTransform(
  sourceDataUrl: string,
  sourceCorners: PerspectiveCorners,
  options: {
    padding?: number;
    maxDimension?: number;
    backgroundColor?: string;
  } = {},
): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  const {
    padding = 20,
    maxDimension = 1280,
    backgroundColor = "#ffffff",
  } = options;

  const img = await loadImage(sourceDataUrl);
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = img.width;
  srcCanvas.height = img.height;
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
  if (!srcCtx) throw new Error("Canvas context tidak tersedia");
  srcCtx.drawImage(img, 0, 0);
  const srcImageData = srcCtx.getImageData(0, 0, img.width, img.height);
  const srcData = srcImageData.data;

  const topWidth = distance(sourceCorners.topLeft, sourceCorners.topRight);
  const bottomWidth = distance(sourceCorners.bottomLeft, sourceCorners.bottomRight);
  const leftHeight = distance(sourceCorners.topLeft, sourceCorners.bottomLeft);
  const rightHeight = distance(sourceCorners.topRight, sourceCorners.bottomRight);

  const outWidth = Math.max(topWidth, bottomWidth);
  const outHeight = Math.max(leftHeight, rightHeight);

  const destinationCorners: PerspectiveCorners = {
    topLeft: { x: padding, y: padding },
    topRight: { x: padding + outWidth, y: padding },
    bottomRight: { x: padding + outWidth, y: padding + outHeight },
    bottomLeft: { x: padding, y: padding + outHeight },
  };

  const totalW = Math.ceil(outWidth + 2 * padding);
  const totalH = Math.ceil(outHeight + 2 * padding);

  const scale = Math.min(1, maxDimension / Math.max(totalW, totalH));
  const finalW = Math.ceil(totalW * scale);
  const finalH = Math.ceil(totalH * scale);

  const H = computeHomography(sourceCorners, destinationCorners);
  const Hinv = invertMatrix3x3(H);

  const dstCanvas = document.createElement("canvas");
  dstCanvas.width = finalW;
  dstCanvas.height = finalH;
  const dstCtx = dstCanvas.getContext("2d");
  if (!dstCtx) throw new Error("Canvas context tidak tersedia");

  dstCtx.fillStyle = backgroundColor;
  dstCtx.fillRect(0, 0, finalW, finalH);

  const dstImageData = dstCtx.createImageData(finalW, finalH);
  const dstData = dstImageData.data;

  for (let y = 0; y < finalH; y++) {
    for (let x = 0; x < finalW; x++) {
      const sx_dst = x / scale;
      const sy_dst = y / scale;

      const w = Hinv[2][0] * sx_dst + Hinv[2][1] * sy_dst + Hinv[2][2];
      if (Math.abs(w) < 1e-10) continue;

      const sx_src = (Hinv[0][0] * sx_dst + Hinv[0][1] * sy_dst + Hinv[0][2]) / w;
      const sy_src = (Hinv[1][0] * sx_dst + Hinv[1][1] * sy_dst + Hinv[1][2]) / w;

      const color = bilinearSample(srcData, img.width, img.height, sx_src, sy_src);

      const dstIdx = (y * finalW + x) * 4;
      dstData[dstIdx] = color[0];
      dstData[dstIdx + 1] = color[1];
      dstData[dstIdx + 2] = color[2];
      dstData[dstIdx + 3] = color[3];
    }
  }

  dstCtx.putImageData(dstImageData, 0, 0);

  return {
    dataUrl: dstCanvas.toDataURL("image/jpeg", 0.92),
    width: finalW,
    height: finalH,
  };
}

function bilinearSample(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
): [number, number, number, number] {
  if (x < 0 || y < 0 || x >= width - 1 || y >= height - 1) {
    return [255, 255, 255, 0];
  }

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const dx = x - x0;
  const dy = y - y0;

  const idx00 = (y0 * width + x0) * 4;
  const idx01 = (y0 * width + x1) * 4;
  const idx10 = (y1 * width + x0) * 4;
  const idx11 = (y1 * width + x1) * 4;

  const result: [number, number, number, number] = [0, 0, 0, 0];
  for (let c = 0; c < 4; c++) {
    const v00 = data[idx00 + c];
    const v01 = data[idx01 + c];
    const v10 = data[idx10 + c];
    const v11 = data[idx11 + c];
    const top = v00 * (1 - dx) + v01 * dx;
    const bottom = v10 * (1 - dx) + v11 * dx;
    result[c] = Math.round(top * (1 - dy) + bottom * dy);
  }
  return result;
}

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal load gambar"));
    img.src = src;
  });
}

export function getDefaultCorners(
  width: number,
  height: number,
  marginPercent = 0.1,
): PerspectiveCorners {
  const mx = width * marginPercent;
  const my = height * marginPercent;
  return {
    topLeft: { x: mx, y: my },
    topRight: { x: width - mx, y: my },
    bottomRight: { x: width - mx, y: height - my },
    bottomLeft: { x: mx, y: height - my },
  };
}
