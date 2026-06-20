"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Loader2, CheckCircle2, ScanLine, Sparkles, AlertCircle } from "lucide-react";

const STEPS = [
  { label: "Mengunggah foto ke server..." },
  { label: "Auto-deskew: deteksi & luruskan foto..." },
  { label: "Memproses gambar dengan AI Vision..." },
  { label: "Mengekstrak data anggota keluarga..." },
  { label: "Memvalidasi format NIK & tanggal..." },
];

export function ProcessingScreen() {
  const { navigate, ocrProvider, ocrError, deskewInfo } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (ocrError) {
      const timer = setTimeout(() => navigate("scan"), 2500);
      return () => clearTimeout(timer);
    }
  }, [ocrError, navigate]);

  useEffect(() => {
    if (ocrError) return;
    if (currentStep >= STEPS.length - 1) return;
    const timer = setTimeout(() => {
      setCurrentStep((s) => s + 1);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentStep, ocrError]);

  const progress = Math.min((currentStep / (STEPS.length - 1)) * 90, 90);

  if (ocrError) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-red-600 to-red-700 text-white overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-24 h-24 rounded-full bg-white/15 flex items-center justify-center mb-6 ring-4 ring-white/10">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">OCR Gagal</h2>
          <p className="text-red-100 text-sm mb-6 max-w-xs">{ocrError}</p>
          <p className="text-xs text-red-200 mb-6">
            Mengalihkan kembali ke halaman scan...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-white/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-emerald-700 to-emerald-800 text-white overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <ScanLine className="w-14 h-14 text-white animate-pulse" />
          </div>
          <div className="absolute inset-4 rounded-full overflow-hidden">
            <div className="absolute left-0 right-0 h-0.5 bg-emerald-200 shadow-[0_0_8px_2px_rgba(255,255,255,0.6)] animate-[scan_1.4s_ease-in-out_infinite]" />
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2">Memproses Kartu Keluarga</h2>
        <p className="text-emerald-100 text-sm mb-8 max-w-xs">
          AI Vision sedang membaca dan mengekstrak data KK Anda. Mohon tunggu
          sejenak...
        </p>

        <div className="w-full max-w-xs mb-6">
          <div className="flex justify-between text-xs text-emerald-100 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="w-full max-w-xs space-y-2 text-left">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 transition-opacity ${
                  idx <= currentStep ? "opacity-100" : "opacity-40"
                }`}
              >
                <div className="flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-white/40" />
                  )}
                </div>
                <span className="text-sm text-emerald-50">{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-10 inline-flex items-center gap-1.5 text-xs text-emerald-100 bg-white/10 rounded-full px-3 py-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {ocrProvider
            ? `Powered by ${ocrProvider}`
            : "Z.AI GLM-4V + Gemini Fallback"}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
