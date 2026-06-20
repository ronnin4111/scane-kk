"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Wand2 } from "lucide-react";
import {
  applyPerspectiveTransform,
  getDefaultCorners,
  type PerspectiveCorners,
  type Point,
} from "@/lib/perspective-transform";

interface PerspectiveEditorProps {
  imageDataUrl: string;
  onApply: (resultDataUrl: string) => void;
}

type CornerKey = "topLeft" | "topRight" | "bottomRight" | "bottomLeft";

const CORNER_COLORS: Record<CornerKey, string> = {
  topLeft: "#10b981",
  topRight: "#3b82f6",
  bottomRight: "#f59e0b",
  bottomLeft: "#ec4899",
};

export function PerspectiveEditor({
  imageDataUrl,
  onApply,
}: PerspectiveEditorProps) {
  const [corners, setCorners] = useState<PerspectiveCorners | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [draggingCorner, setDraggingCorner] = useState<CornerKey | null>(null);
  const [applying, setApplying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ w: img.width, h: img.height });
      setCorners(getDefaultCorners(img.width, img.height, 0.08));
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  const getScaledCorners = (
    src: PerspectiveCorners,
    scale: number,
  ): PerspectiveCorners => ({
    topLeft: { x: src.topLeft.x * scale, y: src.topLeft.y * scale },
    topRight: { x: src.topRight.x * scale, y: src.topRight.y * scale },
    bottomRight: {
      x: src.bottomRight.x * scale,
      y: src.bottomRight.y * scale,
    },
    bottomLeft: {
      x: src.bottomLeft.x * scale,
      y: src.bottomLeft.y * scale,
    },
  });

  useEffect(() => {
    if (!canvasRef.current || !imageSize || !corners) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const container = containerRef.current;
      const maxW = container ? container.clientWidth - 16 : 400;
      const maxH = 320;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      setDisplayScale(scale);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.beginPath();
      const scaledCorners = getScaledCorners(corners, scale);
      ctx.moveTo(scaledCorners.topLeft.x, scaledCorners.topLeft.y);
      ctx.lineTo(scaledCorners.topRight.x, scaledCorners.topRight.y);
      ctx.lineTo(scaledCorners.bottomRight.x, scaledCorners.bottomRight.y);
      ctx.lineTo(scaledCorners.bottomLeft.x, scaledCorners.bottomLeft.y);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(scaledCorners.topLeft.x, scaledCorners.topLeft.y);
      ctx.lineTo(scaledCorners.topRight.x, scaledCorners.topRight.y);
      ctx.lineTo(scaledCorners.bottomRight.x, scaledCorners.bottomRight.y);
      ctx.lineTo(scaledCorners.bottomLeft.x, scaledCorners.bottomLeft.y);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      (Object.keys(scaledCorners) as CornerKey[]).forEach((key) => {
        const p = scaledCorners[key];
        ctx.fillStyle = CORNER_COLORS[key];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = CORNER_COLORS[key];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, corners, imageSize]);

  const hitTestCorner = (x: number, y: number): CornerKey | null => {
    if (!corners || !displayScale) return null;
    const scaled = getScaledCorners(corners, displayScale);
    const threshold = 20;
    for (const key of Object.keys(scaled) as CornerKey[]) {
      const p = scaled[key];
      if (Math.hypot(p.x - x, p.y - y) <= threshold) {
        return key;
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitTestCorner(x, y);
    if (hit) {
      setDraggingCorner(hit);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingCorner || !corners || !imageSize) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const origX = Math.max(0, Math.min(imageSize.w, x / displayScale));
    const origY = Math.max(0, Math.min(imageSize.h, y / displayScale));

    setCorners({
      ...corners,
      [draggingCorner]: { x: origX, y: origY },
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDraggingCorner(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    if (imageSize) {
      setCorners(getDefaultCorners(imageSize.w, imageSize.h, 0.08));
    }
  };

  const handleAutoDetect = () => {
    if (!imageSize) return;
    setCorners(getDefaultCorners(imageSize.w, imageSize.h, 0.05));
  };

  const handleApply = async () => {
    if (!corners) return;
    setApplying(true);
    try {
      const result = await applyPerspectiveTransform(imageDataUrl, corners, {
        padding: 10,
        maxDimension: 1280,
        backgroundColor: "#ffffff",
      });
      onApply(result.dataUrl);
    } catch (err) {
      console.error("Perspective transform error:", err);
      alert("Gagal menerapkan transformasi perspektif. Coba lagi.");
    } finally {
      setApplying(false);
    }
  };

  if (!corners || !imageSize) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-md p-2.5 text-emerald-800">
        <strong>💡 Cara pakai:</strong> Drag 4 titik berwarna ke pojok-pojok KK di
        foto. Sistem akan meluruskan KK yang miring karena perspektif.
      </div>

      <div
        ref={containerRef}
        className="bg-muted rounded-lg p-2 flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="max-w-full max-h-[320px] touch-none cursor-crosshair rounded shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoDetect}
          disabled={applying}
          className="h-9 text-xs"
        >
          <Wand2 className="w-3.5 h-3.5 mr-1.5" />
          Auto-Detect
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={applying}
          className="h-9 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reset
        </Button>
      </div>

      <Button
        onClick={handleApply}
        disabled={applying}
        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700"
      >
        {applying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Memproses...
          </>
        ) : (
          "Terapkan Perspektif"
        )}
      </Button>
    </div>
  );
}
