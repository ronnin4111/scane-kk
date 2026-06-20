"use client";

import { useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/mobile-frame";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  ImagePlus,
  FileText,
  Upload,
  Info,
  Loader2,
  Sparkles,
  Crop,
  ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  compressImage,
  formatBytes,
  type CompressQuality,
} from "@/lib/image-compress";
import { ImageEditorModal } from "@/components/image-editor-modal";
import { CameraModal } from "@/components/camera-modal";

const SAMPLE_IMAGES = [
  {
    src: "/samples/kk-sample-1.png",
    label: "Keluarga Wijaya",
    description: "4 anggota — Jakarta Selatan",
  },
  {
    src: "/samples/kk-sample-2.png",
    label: "Keluarga Hartono",
    description: "4 anggota — Yogyakarta",
  },
];

export function ScanScreen() {
  const { navigate, setDraftKeluarga, setOcrMeta } = useAppStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{
    original: number;
    compressed: number;
  } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [quality, setQuality] = useState<CompressQuality>("medium");
  const [manualEditInfo, setManualEditInfo] = useState<{
    angle: number;
    autoDeskewed: boolean;
  } | null>(null);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const urlToDataUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "File tidak valid",
        description: "Pilih file gambar (JPG/PNG).",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Maksimal 10MB. Akan dikompres otomatis.",
        variant: "destructive",
      });
      return;
    }

    setCompressing(true);
    try {
      const result = await compressImage(file, { preset: quality });
      setImageDataUrl(result.dataUrl);
      setPreview(result.dataUrl);
      setCompressionInfo({
        original: result.originalSize,
        compressed: result.compressedSize,
      });

      const ratio = (
        (1 - result.compressedSize / result.originalSize) *
        100
      ).toFixed(0);
      toast({
        title: "Gambar siap",
        description: `${formatBytes(result.originalSize)} → ${formatBytes(
          result.compressedSize,
        )} (−${ratio}%, ${result.width}×${result.height}px, kualitas: ${quality})`,
      });
    } catch (err) {
      console.error("Compression error:", err);
      try {
        const dataUrl = await fileToDataUrl(file);
        setImageDataUrl(dataUrl);
        setPreview(dataUrl);
        setCompressionInfo(null);
      } catch {
        toast({
          title: "Gagal membaca file",
          variant: "destructive",
        });
      }
    } finally {
      setCompressing(false);
    }
  };

  const handleUseSample = async (sampleSrc: string) => {
    try {
      toast({
        title: "Memuat sample KK",
        description: "Gambar sample sedang disiapkan...",
      });
      const dataUrl = await urlToDataUrl(sampleSrc);
      const result = await compressImage(dataUrl, { preset: quality });
      setImageDataUrl(result.dataUrl);
      setPreview(result.dataUrl);
      setCompressionInfo({
        original: result.originalSize,
        compressed: result.compressedSize,
      });
      toast({
        title: "Sample siap",
        description: "Tekan tombol 'Proses dengan AI' untuk mulai OCR.",
      });
    } catch {
      toast({
        title: "Gagal memuat sample",
        variant: "destructive",
      });
    }
  };

  const handleStartOCR = async () => {
    if (!imageDataUrl) {
      toast({
        title: "Belum ada gambar",
        description: "Upload foto KK atau pilih sample terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setOcrMeta(null, null, null);
    navigate("processing");

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      const data = await res.json();

      if (!data.success || !data.data) {
        setOcrMeta(
          data.provider || null,
          data.durationMs || null,
          data.error || "Unknown error",
          data.deskewInfo || null,
        );
        toast({
          title: "OCR gagal",
          description: data.error || "Terjadi kesalahan saat memproses gambar.",
          variant: "destructive",
        });
        setTimeout(() => navigate("scan"), 100);
        return;
      }

      setDraftKeluarga(data.data);
      setOcrMeta(
        data.provider,
        data.durationMs,
        null,
        data.deskewInfo || null,
      );

      const deskewMsg = data.deskewInfo?.corrected
        ? ` • Auto-deskew ${data.deskewInfo.detectedAngle.toFixed(1)}°`
        : "";
      toast({
        title: `OCR berhasil via ${data.provider}`,
        description: `${data.data.anggota.length} anggota terdeteksi dalam ${(data.durationMs / 1000).toFixed(1)}s${deskewMsg}`,
      });
      navigate("review");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setOcrMeta(null, null, msg);
      toast({
        title: "Gagal terhubung ke server",
        description: msg,
        variant: "destructive",
      });
      setTimeout(() => navigate("scan"), 100);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditorSave = (
    newImageDataUrl: string,
    meta: { angle: number; autoDeskewed: boolean },
  ) => {
    setImageDataUrl(newImageDataUrl);
    setPreview(newImageDataUrl);
    setManualEditInfo(meta);
    setEditorOpen(false);

    compressImage(newImageDataUrl, { preset: quality })
      .then((result) => {
        setImageDataUrl(result.dataUrl);
        setPreview(result.dataUrl);
        setCompressionInfo({
          original: result.originalSize,
          compressed: result.compressedSize,
        });
      })
      .catch(() => {});

    toast({
      title: "Foto diperbarui",
      description: meta.autoDeskewed
        ? `Foto diluruskan ${meta.angle.toFixed(1)}° secara otomatis`
        : `Foto dirotasi ${meta.angle > 0 ? "+" : ""}${meta.angle.toFixed(1)}°`,
    });
  };

  const handleCameraCapture = async (capturedDataUrl: string) => {
    setCameraOpen(false);
    setCompressing(true);
    try {
      const result = await compressImage(capturedDataUrl, { preset: quality });
      setImageDataUrl(result.dataUrl);
      setPreview(result.dataUrl);
      setCompressionInfo({
        original: result.originalSize,
        compressed: result.compressedSize,
      });
      setManualEditInfo(null);

      toast({
        title: "Foto berhasil diambil",
        description: `${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (kualitas: ${quality})`,
      });
    } catch (err) {
      console.error("Compression error:", err);
      setImageDataUrl(capturedDataUrl);
      setPreview(capturedDataUrl);
      setCompressionInfo(null);
    } finally {
      setCompressing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AppHeader
        title="Scan Kartu Keluarga"
        subtitle="Foto KK dengan jelas untuk hasil terbaik"
        onBack={() => navigate("home")}
      />

      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-3.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-emerald-900 mb-1">
                Tips foto KK yang baik:
              </p>
              <ul className="text-xs text-emerald-700 space-y-0.5 list-disc list-inside">
                <li>Pastikan seluruh KK terlihat di frame</li>
                <li>Pencahayaan cukup, tidak ada bayangan</li>
                <li>KK tidak miring atau melipat</li>
                <li>Teks pada KK terbaca jelas</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="relative aspect-[3/4] bg-muted rounded-2xl border-2 border-dashed border-emerald-300 overflow-hidden flex items-center justify-center">
          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview KK"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-4 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500/80 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500/80 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500/80 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500/80 rounded-br-lg" />
              </div>
              {compressionInfo && (
                <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
                  {formatBytes(compressionInfo.original)} →{" "}
                  {formatBytes(compressionInfo.compressed)}
                </div>
              )}
              {manualEditInfo && (
                <div className="absolute top-9 left-2 bg-blue-600/90 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
                  {manualEditInfo.autoDeskewed ? "Auto-lurus" : "Manual edit"}:{" "}
                  {manualEditInfo.angle > 0 ? "+" : ""}
                  {manualEditInfo.angle.toFixed(1)}°
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={processing || compressing}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-black/80 disabled:opacity-50"
              >
                Ganti
              </button>
              <button
                onClick={() => setEditorOpen(true)}
                disabled={processing || compressing}
                className="absolute bottom-2 right-2 bg-emerald-600/90 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Crop className="w-3 h-3" />
                Edit Foto
              </button>
            </>
          ) : compressing ? (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
              <p className="font-medium text-foreground">Mengompres gambar...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mengoptimalkan ukuran untuk OCR
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <Camera className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
              </div>
              <p className="font-medium text-foreground">Belum ada foto KK</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Ambil foto langsung dengan kamera, atau pilih dari galeri untuk
                memulai
              </p>
            </div>
          )}
        </div>

        {!preview && !compressing ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setCameraOpen(true)}
              disabled={processing}
              className="h-14 bg-emerald-600 hover:bg-emerald-700 flex flex-col items-center justify-center gap-0.5"
            >
              <Camera className="w-5 h-5" />
              <span className="text-xs font-medium">Ambil Foto</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="h-14 border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex flex-col items-center justify-center gap-0.5"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-xs font-medium">Pilih Galeri</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing || compressing}
              className="h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              {compressing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengompres...
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Ganti Foto
                </>
              )}
            </Button>
            <Button
              onClick={handleStartOCR}
              disabled={!preview || processing || compressing}
              className="h-12"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Proses dengan AI
                </>
              )}
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            atau coba dengan sample
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-2.5">
          <p className="text-xs text-muted-foreground">
            Pilih sample KK untuk mencoba flow OCR AI:
          </p>
          {SAMPLE_IMAGES.map((sample, idx) => (
            <Card
              key={idx}
              className="cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all active:scale-[0.99]"
              onClick={() => !processing && handleUseSample(sample.src)}
            >
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src={sample.src}
                    alt={sample.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{sample.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {sample.description}
                  </p>
                </div>
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">Kualitas Gambar untuk OCR</p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setQuality("medium")}
              className={`flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium border transition-colors ${
                quality === "medium"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>Standar</span>
              <span className="text-[10px] opacity-70">1920px</span>
            </button>
            <button
              onClick={() => setQuality("high")}
              className={`flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium border transition-colors ${
                quality === "high"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>Tinggi</span>
              <span className="text-[10px] opacity-70">2560px</span>
            </button>
            <button
              onClick={() => setQuality("original")}
              className={`flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium border transition-colors ${
                quality === "original"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>Asli</span>
              <span className="text-[10px] opacity-70">Full res</span>
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {quality === "medium" &&
              "⚖️ Balance: akurasi baik (~250-400KB), OCR ~5-15 detik"}
            {quality === "high" &&
              "🎯 Akurasi tinggi: untuk teks kecil/sulit dibaca (~500-900KB)"}
            {quality === "original" &&
              "💎 Maksimal: kirim apa adanya, akurasi terbaik (bisa >1MB)"}
          </p>
        </div>

        <Card className="bg-muted/40 border-border">
          <CardContent className="p-3.5 flex items-start gap-2.5">
            <Upload className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">
                Multi-Provider AI Vision + Auto-Compression + Auto-Deskew
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gambar dikompres (preset: {quality}), diluruskan otomatis jika
                miring, lalu diproses Z.AI GLM-4V (fallback: Google Gemini).
                Tombol <strong>Edit Foto</strong> untuk koreksi manual
                (rotasi/perspektif).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {imageDataUrl && (
        <ImageEditorModal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          initialImage={imageDataUrl}
          onSave={handleEditorSave}
        />
      )}

      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
