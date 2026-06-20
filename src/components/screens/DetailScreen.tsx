"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/mobile-frame";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Users,
  Trash2,
  FileSpreadsheet,
  User,
  Home,
  Pencil,
  Sparkles,
  Calendar,
} from "lucide-react";
import { exportToExcel } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export function DetailScreen() {
  const { keluargaList, selectedKeluargaId, navigate, deleteKeluarga } = useAppStore();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const kk = keluargaList.find((k) => k.id === selectedKeluargaId);

  if (!kk) {
    return (
      <div className="flex-1 flex flex-col">
        <AppHeader title="Detail KK" onBack={() => navigate("home")} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="font-medium">Data tidak ditemukan</p>
          <Button onClick={() => navigate("home")} className="mt-4">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  const kepala = kk.anggota.find((a) => a.id === kk.kepalaKeluargaId);

  const handleExport = () => {
    const csv = exportToExcel([kk]);
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kk-${kk.noKK}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export berhasil",
      description: `Data KK ${kepala?.nama ?? ""} diekspor ke CSV.`,
    });
  };

  const handleDelete = () => {
    deleteKeluarga(kk.id);
    toast({
      title: "KK dihapus",
      description: `Data KK ${kepala?.nama ?? ""} berhasil dihapus.`,
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AppHeader
        title="Detail Kartu Keluarga"
        subtitle={`No. KK: ${kk.noKK}`}
        onBack={() => navigate("home")}
        rightAction={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                aria-label="Hapus"
                className="p-2 rounded-full hover:bg-white/15 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Kartu Keluarga ini?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Seluruh data{" "}
                  <strong>{kk.anggota.length} anggota</strong> keluarga{" "}
                  <strong>{kepala?.nama ?? ""}</strong> akan dihapus permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Hapus Permanen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium text-emerald-50">
                Diproses oleh AI
              </span>
            </div>
            <p className="font-bold text-lg leading-tight">
              {kepala?.nama ?? "Tanpa Kepala Keluarga"}
            </p>
            <p className="text-xs text-emerald-100 mt-0.5">
              {kk.anggota.length} anggota keluarga
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Alamat</h3>
            </div>
            <div className="space-y-2 text-sm">
              <DetailRow label="Alamat Lengkap" value={kk.alamat.alamatLengkap} />
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="Provinsi" value={kk.alamat.provinsi} />
                <DetailRow label="Kabupaten" value={kk.alamat.kabupaten} />
                <DetailRow label="Kecamatan" value={kk.alamat.kecamatan} />
                <DetailRow label="Kelurahan" value={kk.alamat.kelurahan} />
                <DetailRow label="RT" value={kk.alamat.rt} />
                <DetailRow label="RW" value={kk.alamat.rw} />
              </div>
              <Separator className="my-2" />
              <DetailRow label="Kode Pos" value={kk.alamat.kodePos} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Metadata</h3>
            </div>
            <div className="space-y-2 text-sm">
              <DetailRow
                label="Tanggal Dibuat"
                value={new Date(kk.createdAt).toLocaleString("id-ID", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              />
              <DetailRow
                label="Terakhir Diupdate"
                value={new Date(kk.updatedAt).toLocaleString("id-ID", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              />
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">
              Anggota Keluarga ({kk.anggota.length})
            </h3>
          </div>
          <div className="space-y-2">
            {kk.anggota.map((anggota) => {
              const isKepala = anggota.statusHubungan === "KEPALA KELUARGA";
              const isExpanded = expandedId === anggota.id;
              return (
                <Card key={anggota.id} className={isKepala ? "border-emerald-300" : ""}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : anggota.id)}
                    className="w-full p-3.5 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isKepala
                          ? "bg-emerald-500 text-white"
                          : anggota.jenisKelamin === "PEREMPUAN"
                            ? "bg-pink-100 text-pink-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{anggota.nama}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {anggota.statusHubungan} • {anggota.jenisKelamin}
                      </p>
                    </div>
                    {isKepala && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">
                        Kepala KK
                      </Badge>
                    )}
                    <svg
                      className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <CardContent className="p-4 pt-0 space-y-2.5">
                      <Separator className="mb-3" />
                      <DetailRow label="NIK" value={anggota.nik} mono />
                      <DetailRow
                        label="Tempat, Tanggal Lahir"
                        value={`${anggota.tempatLahir}, ${formatTanggal(anggota.tanggalLahir)}`}
                      />
                      <DetailRow label="Agama" value={anggota.agama} />
                      <DetailRow label="Pendidikan" value={anggota.pendidikan} />
                      <DetailRow label="Pekerjaan" value={anggota.pekerjaan} />
                      <DetailRow label="Status Perkawinan" value={anggota.statusPerkawinan} />
                      <DetailRow label="Kewarganegaraan" value={anggota.kewarganegaraan} />
                      <Separator className="my-1" />
                      <DetailRow label="Nama Ayah" value={anggota.namaAyah} />
                      <DetailRow label="Nama Ibu" value={anggota.namaIbu} />
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 bg-background border-t p-3 grid grid-cols-2 gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button
          variant="outline"
          onClick={handleExport}
          className="h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
        <Button
          onClick={() =>
            toast({
              title: "Fitur edit",
              description: "Mode edit akan tersedia di versi production.",
            })
          }
          className="h-12"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit Data
        </Button>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value || "-"}
      </span>
    </div>
  );
}

function formatTanggal(tanggal: string): string {
  if (!tanggal) return "-";
  try {
    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return tanggal;
  }
}
