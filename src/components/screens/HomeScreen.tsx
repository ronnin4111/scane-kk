"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Home as HomeIcon,
  Search,
  Camera,
  LogOut,
  FileSpreadsheet,
  ChevronRight,
  Calendar,
  MapPin,
} from "lucide-react";
import { exportToExcel } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export function HomeScreen() {
  const { keluargaList, user, navigate, logout } = useAppStore();
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const stats = useMemo(() => {
    const totalKK = keluargaList.length;
    const totalAnggota = keluargaList.reduce(
      (sum, kk) => sum + kk.anggota.length,
      0,
    );
    const totalLaki = keluargaList.reduce(
      (sum, kk) =>
        sum + kk.anggota.filter((a) => a.jenisKelamin === "LAKI-LAKI").length,
      0,
    );
    const totalPerempuan = totalAnggota - totalLaki;
    return { totalKK, totalAnggota, totalLaki, totalPerempuan };
  }, [keluargaList]);

  const filteredKK = useMemo(() => {
    if (!search.trim()) return keluargaList;
    const q = search.toLowerCase();
    return keluargaList.filter((kk) => {
      if (kk.noKK.includes(q)) return true;
      const kepala = kk.anggota.find((a) => a.id === kk.kepalaKeluargaId);
      if (kepala?.nama.toLowerCase().includes(q)) return true;
      return kk.anggota.some(
        (a) => a.nama.toLowerCase().includes(q) || a.nik.includes(q),
      );
    });
  }, [keluargaList, search]);

  const handleExport = () => {
    if (keluargaList.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Belum ada data KK untuk diekspor.",
        variant: "destructive",
      });
      return;
    }
    const csv = exportToExcel(keluargaList);
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data-kk-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export berhasil",
      description: `${stats.totalKK} KK dengan ${stats.totalAnggota} anggota diekspor ke CSV.`,
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
      <header className="flex-shrink-0 bg-primary text-primary-foreground px-5 pt-8 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center font-bold text-sm ring-2 ring-white/20">
              {user?.displayName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-emerald-100">Halo, selamat datang</p>
              <p className="font-semibold truncate">
                {user?.displayName ?? "Operator"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm("Yakin ingin keluar?")) logout();
            }}
            aria-label="Keluar"
            className="p-2 rounded-full hover:bg-white/15 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white/12 backdrop-blur-sm rounded-2xl p-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2 mb-1">
              <HomeIcon className="w-4 h-4 text-emerald-100" />
              <span className="text-xs text-emerald-100">Total KK</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalKK}</p>
          </div>
          <div className="bg-white/12 backdrop-blur-sm rounded-2xl p-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-emerald-100" />
              <span className="text-xs text-emerald-100">Total Anggota</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalAnggota}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mt-2.5">
          <div className="bg-white/8 backdrop-blur-sm rounded-xl p-2.5 ring-1 ring-white/10">
            <span className="text-xs text-emerald-100">Laki-laki</span>
            <p className="text-base font-bold">{stats.totalLaki}</p>
          </div>
          <div className="bg-white/8 backdrop-blur-sm rounded-xl p-2.5 ring-1 ring-white/10">
            <span className="text-xs text-emerald-100">Perempuan</span>
            <p className="text-base font-bold">{stats.totalPerempuan}</p>
          </div>
        </div>
      </header>

      <div className="flex-shrink-0 px-4 pt-4 pb-3 bg-background border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no KK, NIK, atau nama..."
            className="pl-9 h-11 bg-muted/30 border-border"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="mt-2.5 w-full h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export semua data ke Excel
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {filteredKK.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <HomeIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Belum ada data KK</p>
            <p className="text-sm text-muted-foreground mt-1 px-8">
              {search
                ? `Tidak ada hasil untuk "${search}"`
                : "Tap tombol + di bawah untuk scan KK pertama Anda"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground px-1">
              {filteredKK.length} KK ditemukan
            </p>
            {filteredKK.map((kk) => {
              const kepala = kk.anggota.find(
                (a) => a.id === kk.kepalaKeluargaId,
              );
              return (
                <Card
                  key={kk.id}
                  className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                  onClick={() => navigate("detail", kk.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-base leading-tight truncate">
                          {kepala?.nama ?? "Tanpa Kepala Keluarga"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                          No. KK: {kk.noKK}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2.5">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {kk.anggota.length} anggota
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(kk.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <p className="line-clamp-1">{kk.alamat.alamatLengkap}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate("scan")}
        aria-label="Scan KK Baru"
        className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-10"
      >
        <Camera className="w-7 h-7" />
      </button>
    </div>
  );
}
