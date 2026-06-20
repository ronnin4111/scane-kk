"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  RotateCw,
  RotateCcw,
  Crop,
  RefreshCw,
  Check,
  Loader2,
  Sparkles,
  Wand2,
  AlertCircle,
  Maximize,
} from "lucide-react";
import { rotateImage, deskewImage } from "@/lib/image-utils";
import { PerspectiveEditor } from "@/components/perspective-editor";

interface ImageEditorModalProps {
  open: boolean;
  onClose: () => void;
  initialImage: string;
  onSave: (dataUrl: string, meta: { angle: number; autoDeskewed: boolean }) => void;
}

type EditorMode = "rotate" | "perspective";

export function ImageEditorModal({
  open,
  onClose,
  initialImage,
  onSave,
}: ImageEditorModalProps) {
  const [editedImage, setEditedImage] = useState<string>(initialImage);
  const [rotation, setRotation] = useState(0);
  const [mode, setMode] = useState<EditorMode>("rotate");
  const [autoDeskewing, setAutoDeskewing] = useState(false);
  const [autoDeskewInfo, setAutoDeskewInfo] = useState<{
    angle: number;
    corrected: boolean;
  } | null>(null);
  const [perspectiveApplied, setPerspectiveApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setEditedImage(initialImage);
      setRotation(0);
      setMode("rotate");
      setAutoDeskewInfo(null);
      setPerspectiveApplied(false);
    }
  }, [open, initialImage]);

  useEffect(() => {
    if (!canvasRef.current || !editedImage) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const maxDisplay = 400;
      const scale = Math.min(1, maxDisplay / Math.max(img.width, img.height));
      const dispW = img.width * scale;
      const dispH = img.height * scale;

      const rad = (rotation * Math.PI) / 180;
      const absSin = Math.abs(Math.sin(rad));
      const absCos = Math.abs(Math.cos(rad));
      canvas.width = Math.ceil(dispW * absCos + dispH * absSin);
      canvas.height = Math.ceil(dispW * absSin + dispH * absCos);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -dispW / 2, -dispH / 2, dispW, dispH);
      ctx.restore();

      ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    img.src = editedImage;
  }, [editedImage, rotation]);

  const applyRotation = useCallback(async () => {
    if (Math.abs(rotation) < 0.1) {
      return editedImage;
    }
    setApplying(true);
    try {
      const result = await rotateImage(editedImage, rotation);
      setEditedImage(result);
      setRotation(0);
      return result;
    } finally {
      setApplying(false);
    }
  }, [editedImage, rotation]);

  const quickRotate = async (direction: "left" | "right") => {
    setApplying(true);
    try {
      const angle = direction === "left" ? -90 : 90;
      const result = await rotateImage(editedImage, angle);
      setEditedImage(result);
    } finally {
      setApplying(false);
    }
  };

  const handleAutoDeskew = async () => {
    setAutoDeskewing(true);
    try {
      let currentImage = editedImage;
      if (Math.abs(rotation) >= 0.1) {
        currentImage = await rotateImage(editedImage, rotation);
        setEditedImage(currentImage);
        setRotation(0);
      }

      const result = await deskewImage(currentImage, {
        minAngle: -30,
        maxAngle: 30,
        minConfidence: 0.02,
        minAngleToCorrect: 0.5,
      });

      if (result.corrected) {
        setEditedImage(result.deskewedDataUrl);
        setAutoDeskewInfo({
          angle: result.detectedAngle,
          corrected: true,
        });
      } else {
        setAutoDeskewInfo({
          angle: result.detectedAngle,
          corrected: false,
        });
      }
    } catch (err) {
      console.error("Auto-deskew error:", err);
    } finally {
      setAutoDeskewing(false);
    }
  };

  const handleReset = () => {
    setEditedImage(initialImage);
    setRotation(0);
    setAutoDeskewInfo(null);
    setPerspectiveApplied(false);
  };

  const handlePerspectiveApply = (resultDataUrl: string) => {
    setEditedImage(resultDataUrl);
    setPerspectiveApplied(true);
    setMode("rotate");
  };

  const handleSave = async () => {
    const finalImage = await applyRotation();
    onSave(finalImage, {
      angle: rotation + (autoDeskewInfo?.angle ? -autoDeskewInfo.angle : 0),
      autoDeskewed: autoDeskewInfo?.corrected ?? false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Crop className="w-4 h-4 text-primary" />
            Edit Foto KK
          </DialogTitle>
          <DialogDescription className="text-xs">
            Luruskan &amp; sesuaikan foto sebelum diproses AI
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setMode("rotate")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                mode === "rotate"
                  ? "bg-white shadow-sm text-emerald-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              Rotasi &amp; Auto-Lurus
            </button>
            <button
              onClick={() => setMode("perspective")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                mode === "perspective"
                  ? "bg-white shadow-sm text-emerald-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Maximize className="w-3.5 h-3.5" />
              Perspektif
            </button>
          </div>

          {perspectiveApplied && mode === "rotate" && (
            <div className="text-xs px-3 py-2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-2">
              <Maximize className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Perspektif sudah diterapkan. Anda bisa lanjut atur rotasi.</span>
            </div>
          )}

          {mode === "perspective" ? (
            <PerspectiveEditor
              imageDataUrl={editedImage}
              onApply={handlePerspectiveApply}
            />
          ) : (
            <>
              <div
                ref={containerRef}
                className="bg-muted rounded-lg p-3 flex items-center justify-center min-h-[280px]"
              >
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[280px] object-contain shadow-sm rounded"
                />
              </div>

              {autoDeskewInfo && (
                <div
                  className={`text-xs px-3 py-2 rounded-md flex items-center gap-2 ${
                    autoDeskewInfo.corrected
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-muted text-muted-foreground border"
                  }`}
                >
                  {autoDeskewInfo.corrected ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        Auto-deskew berhasil! Foto diluruskan{" "}
                        {autoDeskewInfo.angle.toFixed(1)}°
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        Foto sudah lurus (terdeteksi miring{" "}
                        {autoDeskewInfo.angle.toFixed(1)}°, tidak perlu koreksi)
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickRotate("left")}
                  disabled={applying || autoDeskewing}
                  className="flex flex-col items-center gap-0.5 h-auto py-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[10px]">90° Kiri</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickRotate("right")}
                  disabled={applying || autoDeskewing}
                  className="flex flex-col items-center gap-0.5 h-auto py-2"
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="text-[10px]">90° Kanan</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoDeskew}
                  disabled={applying || autoDeskewing}
                  className="flex flex-col items-center gap-0.5 h-auto py-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  {autoDeskewing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  <span className="text-[10px]">Auto-Lurus</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={applying || autoDeskewing}
                  className="flex flex-col items-center gap-0.5 h-auto py-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-[10px]">Reset</span>
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium">Rotasi Halus</label>
                  <span className="font-mono text-muted-foreground">
                    {rotation > 0 ? "+" : ""}
                    {rotation.toFixed(1)}°
                  </span>
                </div>
                <Slider
                  value={[rotation]}
                  min={-45}
                  max={45}
                  step={0.5}
                  onValueChange={(v) => setRotation(v[0])}
                  disabled={applying || autoDeskewing}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>−45°</span>
                  <span>0°</span>
                  <span>+45°</span>
                </div>
              </div>

              <div className="text-xs bg-emerald-50 border border-emerald-100 rounded-md p-3 text-emerald-800">
                <p className="font-medium mb-1">💡 Tips:</p>
                <ul className="space-y-0.5 list-disc list-inside text-emerald-700">
                  <li>
                    Klik <strong>Auto-Lurus</strong> untuk deteksi &amp; koreksi
                    otomatis
                  </li>
                  <li>Gunakan slider untuk rotasi halus (±45°)</li>
                  <li>Pastikan garis hijau berimpit dengan baris teks KK</li>
                  <li>
                    Untuk foto miring perspektif (keystone), gunakan tab{" "}
                    <strong>Perspektif</strong>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="p-4 border-t gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={applying || autoDeskewing}
          >
            Batal
          </Button>
          <Button onClick={handleSave} disabled={applying || autoDeskewing}>
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menerapkan...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Simpan &amp; Lanjut
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
