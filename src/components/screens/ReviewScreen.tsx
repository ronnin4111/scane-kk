"use client";

import { useState, useMemo, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/mobile-frame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Save,
  User,
  Users,
  Home,
  ShieldAlert,
  Sparkles,
  Clock,
  Calendar,
} from "lucide-react";
import {
  isValidNIK,
  isValidNoKK,
  isValidTanggal,
  isValidKodePos,
  isDuplicateNIK,
  isDuplicateNoKK,
  genId,
} from "@/lib/mock-data";
import { parseNIK } from "@/lib/nik-parser";
import type { AnggotaKeluarga, Keluarga } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const JENIS_KELAMIN_OPTIONS = ["LAKI-LAKI", "PEREMPUAN"];
const AGAMA_OPTIONS = ["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU", "LAINNYA"];
const STATUS_HUBUNGAN_OPTIONS = [
  "KEPALA KELUARGA", "ISTRI", "SUAMI", "ANAK", "MENANTU", "CUCU",
  "ORANG TUA", "MERTUA", "FAMILI LAIN", "PEMBANTU", "LAINNYA",
];
const STATUS_PERKAWINAN_OPTIONS = ["BELUM KAWIN", "KAWIN", "CERAI HIDUP", "CERAI MATI"];
const PENDIDIKAN_OPTIONS = [
  "TIDAK / BELUM SEKOLAH", "BELUM SEKOLAH", "SD / SEDERAJAT",
  "SLTP / SEDERAJAT", "SLTA / SEDERAJAT", "DIPLOMA I/II", "DIPLOMA III",
  "SARJANA (S1)", "S2", "S3",
];

export function ReviewScreen() {
  const {
    draftKeluarga,
    setDraftKeluarga,
    addKeluarga,
    navigate,
    keluargaList,
    ocrProvider,
    ocrDurationMs,
    deskewInfo,
  } = useAppStore();
  const { toast } = useToast();

  const [draft, setDraft] = useState<
    Omit<Keluarga, "id" | "createdBy" | "createdAt" | "updatedAt"> | null
  >(draftKeluarga);

  const errors = useMemo(() => {
    if (!draft) return {};
    const e: Record<string, string> = {};
    if (!isValidNoKK(draft.noKK)) e.noKK = "No. KK harus 16 digit angka";
    if (isDuplicateNoKK(draft.noKK, keluargaList)) {
      e.noKK = "No. KK sudah ada di database";
    }
    if (!isValidKodePos(draft.alamat.kodePos)) e.kodePos = "Kode pos harus 5 digit";
    if (!draft.alamat.provinsi) e.provinsi = "Wajib diisi";
    if (!draft.alamat.kabupaten) e.kabupaten = "Wajib diisi";
    if (!draft.alamat.kecamatan) e.kecamatan = "Wajib diisi";
    if (!draft.alamat.kelurahan) e.kelurahan = "Wajib diisi";
    draft.anggota.forEach((a, idx) => {
      if (!isValidNIK(a.nik))
        e[`anggota_${a.id}_nik`] = `NIK anggota #${idx + 1} harus 16 digit`;
      if (isDuplicateNIK(a.nik, keluargaList))
        e[`anggota_${a.id}_nik`] = `NIK anggota #${idx + 1} sudah terdaftar`;
      if (!a.nama.trim())
        e[`anggota_${a.id}_nama`] = `Nama anggota #${idx + 1} wajib diisi`;
      if (!isValidTanggal(a.tanggalLahir))
        e[`anggota_${a.id}_tanggalLahir`] = `Tanggal lahir anggota #${idx + 1} tidak valid`;
    });
    const hasKepala = draft.anggota.some(
      (a) => a.statusHubungan === "KEPALA KELUARGA",
    );
    if (!hasKepala) e.kepala = "Wajib ada minimal 1 kepala keluarga";
    return e;
  }, [draft, keluargaList]);

  // State untuk track field yang sedang di-highlight (harus sebelum early return)
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("kk");

  // Daftar saran pendidikan untuk datalist
  const PENDIDIKAN_SUGGESTIONS = [
    "TIDAK / BELUM SEKOLAH",
    "BELUM SEKOLAH",
    "SD / SEDERAJAT",
    "SLTP / SEDERAJAT",
    "SLTA / SEDERAJAT",
    "DIPLOMA I/II",
    "DIPLOMA III",
    "SARJANA (S1)",
    "S2",
    "S3",
  ];

  // Function: klik error → scroll & highlight field
  // Pakai data-error-key attribute + querySelector dengan retry mechanism
  const jumpToError = useCallback(
    (errorKey: string, anggotaId?: string) => {
      // Set tab ke anggota kalau error ada di anggota
      if (anggotaId) {
        setActiveTab("anggota");
      }

      // Retry mechanism: coba cari element beberapa kali dengan delay increasing
      // (Radix Tabs butuh waktu untuk render content tab yang baru)
      const tryScroll = (attempt: number) => {
        const el = document.querySelector(
          `[data-error-key="${errorKey}"]`,
        ) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setHighlightedField(errorKey);
          setTimeout(() => setHighlightedField(null), 3000);
          return;
        }
        // Retry sampai 5 kali dengan delay 100ms, 300ms, 500ms, 700ms, 900ms
        if (attempt < 5) {
          setTimeout(() => tryScroll(attempt + 1), 200 + attempt * 200);
        }
      };
      // Mulai dengan delay awal 300ms (tunggu tab switch selesai)
      setTimeout(() => tryScroll(0), 300);
    },
    [],
  );

  // Build list of errors yang clickable untuk navigation
  const errorList = useMemo(() => {
    if (!draft) return [];
    const list: Array<{
      key: string;
      message: string;
      anggotaId?: string;
      field: string;
      nama?: string;
    }> = [];

    for (const [errorKey, message] of Object.entries(errors)) {
      let anggotaId: string | undefined;
      let nama: string | undefined;
      let field = errorKey;

      if (errorKey.startsWith("anggota_")) {
        const parts = errorKey.split("_");
        anggotaId = parts.slice(1, -1).join("_");
        const anggota = draft.anggota.find((a) => a.id === anggotaId);
        nama = anggota?.nama || `Anggota ${anggotaId}`;
        field = parts[parts.length - 1];
        const fieldLabels: Record<string, string> = {
          nik: "NIK",
          nama: "Nama",
          tanggalLahir: "Tanggal Lahir",
        };
        field = fieldLabels[field] || field;
      } else {
        const fieldLabels: Record<string, string> = {
          noKK: "Nomor KK",
          provinsi: "Provinsi",
          kabupaten: "Kabupaten",
          kecamatan: "Kecamatan",
          kelurahan: "Kelurahan",
          kodePos: "Kode Pos",
          kepala: "Kepala Keluarga",
        };
        field = fieldLabels[errorKey] || errorKey;
      }
      list.push({ key: errorKey, message, anggotaId, field, nama });
    }
    return list;
  }, [errors, draft]);

  if (!draft) {
    return (
      <div className="flex-1 flex flex-col">
        <AppHeader title="Review Data" onBack={() => navigate("scan")} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="font-medium">Tidak ada draft untuk direview</p>
          <Button onClick={() => navigate("scan")} className="mt-4">
            Kembali ke Scan
          </Button>
        </div>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  const updateAlamat = (field: keyof Keluarga["alamat"], value: string) => {
    setDraft({
      ...draft,
      alamat: { ...draft.alamat, [field]: value },
    });
  };

  const updateAnggota = (id: string, data: Partial<AnggotaKeluarga>) => {
    setDraft({
      ...draft,
      anggota: draft.anggota.map((a) => {
        if (a.id !== id) return a;
        const updated = { ...a, ...data };

        if (data.nik !== undefined && updated.nik.length === 16) {
          const parsed = parseNIK(updated.nik);
          if (parsed.isValid) {
            if (parsed.tanggalLahirISO) {
              updated.tanggalLahir = parsed.tanggalLahirISO;
            }
            if (parsed.jenisKelamin) {
              updated.jenisKelamin = parsed.jenisKelamin;
            }
          }
        }

        return updated;
      }),
    });
  };

  const addAnggota = () => {
    const newAnggota: AnggotaKeluarga = {
      id: genId("anggota"),
      nik: "",
      nama: "",
      jenisKelamin: "LAKI-LAKI",
      tempatLahir: "",
      tanggalLahir: "",
      agama: "ISLAM",
      pendidikan: "SD / SEDERAJAT",
      pekerjaan: "",
      statusPerkawinan: "BELUM KAWIN",
      statusHubungan: "ANAK",
      kewarganegaraan: "WNI",
      namaAyah: "",
      namaIbu: "",
    };
    setDraft({ ...draft, anggota: [...draft.anggota, newAnggota] });
    setActiveTab("anggota");
  };

  const removeAnggota = (id: string) => {
    if (draft.anggota.length === 1) {
      toast({
        title: "Tidak dapat menghapus",
        description: "Minimal harus ada 1 anggota keluarga.",
        variant: "destructive",
      });
      return;
    }
    setDraft({
      ...draft,
      anggota: draft.anggota.filter((a) => a.id !== id),
    });
  };

  const handleSave = () => {
    if (errorCount > 0) {
      toast({
        title: "Tidak dapat menyimpan",
        description: `Masih ada ${errorCount} kesalahan yang perlu diperbaiki.`,
        variant: "destructive",
      });
      return;
    }
    const kepala = draft.anggota.find(
      (a) => a.statusHubungan === "KEPALA KELUARGA",
    );
    const finalDraft = {
      ...draft,
      kepalaKeluargaId: kepala?.id ?? draft.kepalaKeluargaId,
    };
    const newId = addKeluarga(finalDraft);
    setDraftKeluarga(null);
    toast({
      title: "Data KK berhasil disimpan",
      description: `${draft.anggota.length} anggota keluarga tersimpan ke database.`,
    });
    navigate("detail", newId);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AppHeader
        title="Review & Edit Data"
        subtitle={`${draft.anggota.length} anggota terdeteksi`}
        onBack={() => navigate("scan")}
        rightAction={
          errorCount > 0 ? (
            <Badge variant="destructive" className="bg-red-500 text-white">
              {errorCount} error
            </Badge>
          ) : (
            <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Valid
            </Badge>
          )
        }
      />

      {ocrProvider && (
        <div className="flex-shrink-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-medium">Diekstrak oleh {ocrProvider}</span>
            {deskewInfo?.corrected && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                Auto-deskew {deskewInfo.detectedAngle.toFixed(1)}°
              </span>
            )}
          </div>
          {ocrDurationMs && (
            <div className="flex items-center gap-1 text-emerald-50">
              <Clock className="w-3 h-3" />
              <span>{(ocrDurationMs / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>
      )}

      {/* Error navigation panel — list error yang clickable */}
      {errorCount > 0 && (
        <div className="flex-shrink-0 bg-red-50 border-b border-red-200 px-3 py-2.5 relative z-20">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-red-700">
              {errorCount} error — ketuk untuk loncat ke field:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {errorList.map((err) => (
              <button
                key={err.key}
                onClick={() => jumpToError(err.key, err.anggotaId)}
                type="button"
                className={`inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg border-2 cursor-pointer transition-all active:scale-95 ${
                  highlightedField === err.key
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400"
                }`}
              >
                <span className="font-semibold">{err.field}</span>
                {err.nama && (
                  <span className="opacity-70 truncate max-w-[100px]">
                    • {err.nama}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted/40 border-b h-12">
          <TabsTrigger value="kk" className="text-sm gap-1.5">
            <Home className="w-4 h-4" />
            Data KK
          </TabsTrigger>
          <TabsTrigger value="anggota" className="text-sm gap-1.5">
            <Users className="w-4 h-4" />
            Anggota ({draft.anggota.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kk" className="flex-1 overflow-y-auto p-4 mt-0 space-y-4 pb-24">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div
                data-error-key="noKK"
                className={`space-y-1.5 rounded-lg p-1 -m-1 transition-all ${
                  highlightedField === "noKK" ? "bg-red-100 ring-2 ring-red-400" : ""
                }`}
              >
                <Label htmlFor="noKK" className="text-sm font-medium">
                  Nomor KK <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="noKK"
                  value={draft.noKK}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      noKK: e.target.value.replace(/\D/g, "").slice(0, 16),
                    })
                  }
                  inputMode="numeric"
                  className={`font-mono ${errors.noKK ? "border-destructive focus-visible:ring-destructive" : "border-emerald-200"}`}
                />
                {errors.noKK && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.noKK}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div>
            <p className="text-sm font-semibold mb-2 px-1 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-primary" />
              Alamat
              {(() => {
                const kepala = draft.anggota.find(
                  (a) => a.id === draft.kepalaKeluargaId,
                );
                if (
                  kepala &&
                  kepala.nik.length === 16 &&
                  parseNIK(kepala.nik).isValid
                ) {
                  const parsed = parseNIK(kepala.nik);
                  if (
                    parsed.provinsiName === draft.alamat.provinsi ||
                    parsed.kabupatenName === draft.alamat.kabupaten
                  ) {
                    return (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Sparkles className="w-3 h-3" />
                        Auto-fill dari NIK Kepala Keluarga
                      </span>
                    );
                  }
                }
                return null;
              })()}
            </p>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Provinsi"
                    required
                    value={draft.alamat.provinsi}
                    onChange={(v) => updateAlamat("provinsi", v)}
                    error={errors.provinsi}
                    dataErrorKey="provinsi"
                    highlighted={highlightedField === "provinsi"}
                  />
                  <FormField
                    label="Kabupaten/Kota"
                    required
                    value={draft.alamat.kabupaten}
                    onChange={(v) => updateAlamat("kabupaten", v)}
                    error={errors.kabupaten}
                    dataErrorKey="kabupaten"
                    highlighted={highlightedField === "kabupaten"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Kecamatan"
                    required
                    value={draft.alamat.kecamatan}
                    onChange={(v) => updateAlamat("kecamatan", v)}
                    error={errors.kecamatan}
                    dataErrorKey="kecamatan"
                    highlighted={highlightedField === "kecamatan"}
                  />
                  <FormField
                    label="Kelurahan/Desa"
                    required
                    value={draft.alamat.kelurahan}
                    onChange={(v) => updateAlamat("kelurahan", v)}
                    error={errors.kelurahan}
                    dataErrorKey="kelurahan"
                    highlighted={highlightedField === "kelurahan"}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    label="RT"
                    value={draft.alamat.rt}
                    onChange={(v) => updateAlamat("rt", v)}
                  />
                  <FormField
                    label="RW"
                    value={draft.alamat.rw}
                    onChange={(v) => updateAlamat("rw", v)}
                  />
                  <FormField
                    label="Kode Pos"
                    value={draft.alamat.kodePos}
                    onChange={(v) =>
                      updateAlamat("kodePos", v.replace(/\D/g, "").slice(0, 5))
                    }
                    error={errors.kodePos}
                    dataErrorKey="kodePos"
                    highlighted={highlightedField === "kodePos"}
                  />
                </div>
                <FormField
                  label="Alamat Lengkap"
                  value={draft.alamat.alamatLengkap}
                  onChange={(v) => updateAlamat("alamatLengkap", v)}
                />
              </CardContent>
            </Card>
          </div>

          {errors.kepala && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3.5 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">{errors.kepala}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="anggota" className="flex-1 overflow-y-auto p-4 mt-0 space-y-3 pb-24">
          {draft.anggota.map((anggota, idx) => (
            <AnggotaEditor
              key={anggota.id}
              anggota={anggota}
              index={idx}
              errors={errors}
              onUpdate={(data) => updateAnggota(anggota.id, data)}
              onRemove={() => removeAnggota(anggota.id)}
              highlightedField={highlightedField}
              pendidikanSuggestions={PENDIDIKAN_SUGGESTIONS}
            />
          ))}

          <Button
            variant="outline"
            onClick={addAnggota}
            className="w-full h-12 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Anggota Keluarga
          </Button>
        </TabsContent>
      </Tabs>

      <div className="flex-shrink-0 bg-background border-t p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button
          onClick={handleSave}
          disabled={errorCount > 0}
          className="w-full h-12 font-semibold"
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          Simpan Data KK
        </Button>
        {errorCount > 0 && (
          <p className="text-xs text-destructive text-center mt-1.5">
            Perbaiki {errorCount} kesalahan untuk mengaktifkan tombol simpan
          </p>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  dataErrorKey,
  highlighted,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  dataErrorKey?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      data-error-key={dataErrorKey}
      className={`space-y-1 rounded-lg p-1 -m-1 transition-all ${
        highlighted ? "bg-red-100 ring-2 ring-red-400" : ""
      }`}
    >
      <Label className="text-xs text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-10 text-sm ${error ? "border-destructive" : ""}`}
      />
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function AnggotaEditor({
  anggota,
  index,
  errors,
  onUpdate,
  onRemove,
  highlightedField,
  pendidikanSuggestions,
}: {
  anggota: AnggotaKeluarga;
  index: number;
  errors: Record<string, string>;
  onUpdate: (data: Partial<AnggotaKeluarga>) => void;
  onRemove: () => void;
  highlightedField: string | null;
  pendidikanSuggestions: string[];
}) {
  const errNik = errors[`anggota_${anggota.id}_nik`];
  const errNama = errors[`anggota_${anggota.id}_nama`];
  const errTanggal = errors[`anggota_${anggota.id}_tanggalLahir`];
  // Auto-expand kalau ada error di anggota ini
  const hasError = !!(errNik || errNama || errTanggal);
  const [expanded, setExpanded] = useState(index === 0 || hasError);
  const isKepala = anggota.statusHubungan === "KEPALA KELUARGA";

  return (
    <Card
      className={`${isKepala ? "border-emerald-300 bg-emerald-50/30" : ""} overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3.5 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isKepala ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          <User className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {anggota.nama || `Anggota #${index + 1}`}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {anggota.statusHubungan} • NIK: {anggota.nik || "(kosong)"}
          </p>
        </div>
        {isKepala && (
          <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">
            Kepala KK
          </Badge>
        )}
        <svg
          className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div
              data-error-key={`anggota_${anggota.id}_nik`}
              className={`col-span-2 space-y-1 rounded-lg p-1 -m-1 transition-all ${
                highlightedField === `anggota_${anggota.id}_nik`
                  ? "bg-red-100 ring-2 ring-red-400"
                  : ""
              }`}
            >
              <Label className="text-xs text-muted-foreground">
                NIK <span className="text-destructive">*</span>
              </Label>
              <Input
                value={anggota.nik}
                onChange={(e) =>
                  onUpdate({
                    nik: e.target.value.replace(/\D/g, "").slice(0, 16),
                  })
                }
                inputMode="numeric"
                className={`font-mono text-sm h-10 ${errNik ? "border-destructive" : "border-emerald-200"}`}
              />
              {errNik && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errNik}
                </p>
              )}
            </div>
            <div
              data-error-key={`anggota_${anggota.id}_nama`}
              className={`col-span-2 space-y-1 rounded-lg p-1 -m-1 transition-all ${
                highlightedField === `anggota_${anggota.id}_nama`
                  ? "bg-red-100 ring-2 ring-red-400"
                  : ""
              }`}
            >
              <Label className="text-xs text-muted-foreground">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                value={anggota.nama}
                onChange={(e) => onUpdate({ nama: e.target.value.toUpperCase() })}
                className={`text-sm h-10 ${errNama ? "border-destructive" : ""}`}
              />
              {errNama && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errNama}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Jenis Kelamin</Label>
              <Select
                value={anggota.jenisKelamin}
                onValueChange={(v) => onUpdate({ jenisKelamin: v as AnggotaKeluarga["jenisKelamin"] })}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_KELAMIN_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status Hubungan</Label>
              <Select
                value={anggota.statusHubungan}
                onValueChange={(v) => onUpdate({ statusHubungan: v })}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_HUBUNGAN_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tempat Lahir</Label>
              <Input
                value={anggota.tempatLahir}
                onChange={(e) => onUpdate({ tempatLahir: e.target.value.toUpperCase() })}
                className="text-sm h-10"
              />
            </div>
            <div
              data-error-key={`anggota_${anggota.id}_tanggalLahir`}
              className={`space-y-1 rounded-lg p-1 -m-1 transition-all ${
                highlightedField === `anggota_${anggota.id}_tanggalLahir`
                  ? "bg-red-100 ring-2 ring-red-400"
                  : ""
              }`}
            >
              <Label className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Tanggal Lahir</span>
                {anggota.nik.length === 16 &&
                  parseNIK(anggota.nik).isValid &&
                  parseNIK(anggota.nik).tanggalLahirISO === anggota.tanggalLahir && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <Sparkles className="w-3 h-3" />
                      Auto-detect dari NIK
                    </span>
                  )}
              </Label>
              <Input
                type="date"
                value={anggota.tanggalLahir}
                onChange={(e) => onUpdate({ tanggalLahir: e.target.value })}
                className={`text-sm h-10 ${
                  errTanggal ? "border-destructive" :
                  anggota.nik.length === 16 &&
                  parseNIK(anggota.nik).isValid &&
                  parseNIK(anggota.nik).tanggalLahirISO === anggota.tanggalLahir
                    ? "border-emerald-300 bg-emerald-50/30" : ""
                }`}
              />
              {errTanggal ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errTanggal}
                </p>
              ) : anggota.nik.length === 16 && parseNIK(anggota.nik).isValid ? (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Berdasarkan NIK: {parseNIK(anggota.nik).tanggalLahir}{" "}
                  {parseNIK(anggota.nik).bulanLahir}/
                  {parseNIK(anggota.nik).tahunLahir} (
                  {parseNIK(anggota.nik).jenisKelamin})
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Agama</Label>
              <Select
                value={anggota.agama}
                onValueChange={(v) => onUpdate({ agama: v })}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGAMA_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status Perkawinan</Label>
              <Select
                value={anggota.statusPerkawinan}
                onValueChange={(v) => onUpdate({ statusPerkawinan: v })}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_PERKAWINAN_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pendidikan</Label>
              <Input
                list={`pendidikan-list-${anggota.id}`}
                value={anggota.pendidikan}
                onChange={(e) => onUpdate({ pendidikan: e.target.value.toUpperCase() })}
                placeholder="Ketik atau pilih pendidikan"
                className="text-sm h-10"
              />
              <datalist id={`pendidikan-list-${anggota.id}`}>
                {pendidikanSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pekerjaan</Label>
              <Input
                value={anggota.pekerjaan}
                onChange={(e) => onUpdate({ pekerjaan: e.target.value.toUpperCase() })}
                className="text-sm h-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kewarganegaraan</Label>
            <Input
              value={anggota.kewarganegaraan}
              onChange={(e) => onUpdate({ kewarganegaraan: e.target.value.toUpperCase() })}
              className="text-sm h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nama Ayah</Label>
              <Input
                value={anggota.namaAyah}
                onChange={(e) => onUpdate({ namaAyah: e.target.value.toUpperCase() })}
                className="text-sm h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nama Ibu</Label>
              <Input
                value={anggota.namaIbu}
                onChange={(e) => onUpdate({ namaIbu: e.target.value.toUpperCase() })}
                className="text-sm h-10"
              />
            </div>
          </div>

          <div className="pt-2 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/5"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Anggota Ini
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus anggota keluarga?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Data{" "}
                    <strong>{anggota.nama || "anggota"}</strong> akan dihapus dari
                    daftar anggota keluarga.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onRemove}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
