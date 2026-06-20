"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Camera,
  CameraOff,
  RefreshCw,
  X,
  Check,
  Loader2,
  SwitchCamera,
  AlertCircle,
} from "lucide-react";

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

type CameraStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "unsupported"
  | "error";

export function CameraModal({ open, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const isSupported = useCallback(() => {
    return (
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    );
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopCameraRef = useRef(stopCamera);
  useEffect(() => {
    stopCameraRef.current = stopCamera;
  }, [stopCamera]);

  const startCamera = useCallback(
    async (mode: "environment" | "user" = facingMode) => {
      stopCameraRef.current();

      if (!isSupported()) {
        setStatus("unsupported");
        setErrorMessage(
          "Browser tidak mendukung akses kamera. Gunakan tombol 'Pilih Galeri' untuk upload foto.",
        );
        return;
      }

      setStatus("requesting");
      setErrorMessage("");

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === "videoinput");
          setHasMultipleCameras(videoDevices.length > 1);
        } catch {
          // ignore
        }

        setStatus("active");
      } catch (err) {
        const error = err as DOMException;
        console.error("Camera error:", error);

        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          setStatus("denied");
          setErrorMessage(
            "Akses kamera ditolak. Berikan izin kamera di browser Anda, atau gunakan tombol 'Pilih Galeri'.",
          );
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          setStatus("error");
          setErrorMessage(
            "Kamera tidak ditemukan di perangkat ini. Gunakan tombol 'Pilih Galeri' untuk upload foto.",
          );
        } else if (
          error.name === "NotReadableError" ||
          error.name === "TrackStartError"
        ) {
          setStatus("error");
          setErrorMessage(
            "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.",
          );
        } else if (error.name === "OverconstrainedError") {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              await videoRef.current.play();
            }
            setStatus("active");
            return;
          } catch (err2) {
            setStatus("error");
            setErrorMessage(
              `Tidak bisa mengakses kamera: ${(err2 as Error).message}`,
            );
          }
        } else {
          setStatus("error");
          setErrorMessage(`Error kamera: ${error.message || error.name}`);
        }
      }
    },
    [facingMode, isSupported],
  );

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);

    stopCamera();
  }, [facingMode, stopCamera]);

  const handleSwitchCamera = useCallback(() => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    setCapturedImage(null);
    startCamera(newMode);
  }, [facingMode, startCamera]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
    }
  }, [capturedImage, onCapture]);

  useEffect(() => {
    if (!open) {
      stopCameraRef.current();
      queueMicrotask(() => {
        setCapturedImage(null);
        setStatus("idle");
        setErrorMessage("");
      });
      return;
    }
    const timer = setTimeout(() => startCamera(), 100);
    return () => clearTimeout(timer);
  }, [open, startCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          stopCamera();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md max-h-[95vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-3 border-b bg-emerald-700 text-white">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="w-4 h-4" />
            {capturedImage ? "Konfirmasi Foto" : "Ambil Foto KK"}
          </DialogTitle>
          <DialogDescription className="text-emerald-100 text-xs">
            {capturedImage
              ? "Periksa foto sebelum diproses"
              : "Posisikan KK dalam frame hijau"}
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black aspect-[3/4] flex items-center justify-center">
          {!capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  transform:
                    facingMode === "user" ? "scaleX(-1)" : undefined,
                }}
              />

              {status === "active" && (
                <div className="absolute inset-4 pointer-events-none">
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                    Posisikan KK dalam frame
                  </div>
                </div>
              )}

              {status === "requesting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Loader2 className="w-10 h-10 animate-spin mb-3" />
                  <p className="text-sm">Menyalakan kamera...</p>
                </div>
              )}

              {(status === "denied" ||
                status === "unsupported" ||
                status === "error") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    {status === "unsupported" ? (
                      <CameraOff className="w-8 h-8 text-red-300" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-red-300" />
                    )}
                  </div>
                  <p className="font-medium mb-2">
                    {status === "denied"
                      ? "Akses Kamera Ditolak"
                      : status === "unsupported"
                        ? "Kamera Tidak Didukung"
                        : "Gagal Mengakses Kamera"}
                  </p>
                  <p className="text-xs text-white/80 mb-4 max-w-xs">
                    {errorMessage}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startCamera()}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Coba Lagi
                  </Button>
                </div>
              )}

              {status === "active" && hasMultipleCameras && (
                <button
                  onClick={handleSwitchCamera}
                  aria-label="Ganti Kamera"
                  className="absolute top-3 right-3 p-2.5 bg-black/60 rounded-full text-white hover:bg-black/80 backdrop-blur-sm"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                aria-label="Tutup"
                className="absolute top-3 left-3 p-2.5 bg-black/60 rounded-full text-white hover:bg-black/80 backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}

          {capturedImage && (
            <>
              <img
                src={capturedImage}
                alt="Foto KK yang diambil"
                className="w-full h-full object-contain"
              />
              <button
                onClick={handleRetake}
                aria-label="Foto Ulang"
                className="absolute top-3 left-3 p-2.5 bg-black/60 rounded-full text-white hover:bg-black/80 backdrop-blur-sm"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 bg-white border-t flex items-center justify-center gap-3">
          {!capturedImage ? (
            status === "active" ? (
              <button
                onClick={handleCapture}
                aria-label="Ambil Foto"
                className="rounded-full bg-white border-4 border-emerald-500 p-1 hover:scale-105 active:scale-95 transition-transform shadow-lg"
                style={{ width: "72px", height: "72px" }}
              >
                <div className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-white" />
                </div>
              </button>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                {status === "requesting"
                  ? "Menyiapkan kamera..."
                  : "Kamera tidak aktif"}
              </p>
            )
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 h-12"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Foto Ulang
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Gunakan Foto
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
