import type { Keluarga, AnggotaKeluarga } from "./types";

export function genId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function now(): string {
  return new Date().toISOString();
}

// ============ SAMPLE KK UNTUK DEMO SCAN ============

export const SAMPLE_KK_LIST: Array<{
  label: string;
  description: string;
  data: Omit<Keluarga, "id" | "createdBy" | "createdAt" | "updatedAt">;
}> = [
  {
    label: "Keluarga Wijaya",
    description: "KK 4 anggota — Jakarta Selatan",
    data: {
      noKK: "3174081204800001",
      alamat: {
        provinsi: "DKI JAKARTA",
        kabupaten: "KOTA JAKARTA SELATAN",
        kecamatan: "KEBAYORAN BARU",
        kelurahan: "SELONG",
        rt: "005",
        rw: "008",
        kodePos: "12110",
        alamatLengkap:
          "JL. SENOPATI NO. 12 RT 005 RW 008 KEL. SELONG KEC. KEBAYORAN BARU",
      },
      kepalaKeluargaId: "a1",
      anggota: [
        {
          id: "a1",
          nik: "3174081204800002",
          nama: "BUDI WIDODO WIJAYA",
          jenisKelamin: "LAKI-LAKI",
          tempatLahir: "JAKARTA",
          tanggalLahir: "1980-04-12",
          agama: "ISLAM",
          pendidikan: "SARJANA (S1)",
          pekerjaan: "KARYAWAN SWASTA",
          statusPerkawinan: "KAWIN",
          statusHubungan: "KEPALA KELUARGA",
          kewarganegaraan: "WNI",
          namaAyah: "SURYA WIJAYA",
          namaIbu: "SITI AMINAH",
        },
        {
          id: "a2",
          nik: "3174084503820001",
          nama: "DEWI LESTARI WIJAYA",
          jenisKelamin: "PEREMPUAN",
          tempatLahir: "BANDUNG",
          tanggalLahir: "1982-03-05",
          agama: "ISLAM",
          pendidikan: "SARJANA (S1)",
          pekerjaan: "GURU",
          statusPerkawinan: "KAWIN",
          statusHubungan: "ISTRI",
          kewarganegaraan: "WNI",
          namaAyah: "HADI KUSUMA",
          namaIbu: "RATNA SARI",
        },
        {
          id: "a3",
          nik: "3174081507080003",
          nama: "RAFI PRATAMA WIJAYA",
          jenisKelamin: "LAKI-LAKI",
          tempatLahir: "JAKARTA",
          tanggalLahir: "2008-07-15",
          agama: "ISLAM",
          pendidikan: "SLTA / SEDERAJAT",
          pekerjaan: "PELAJAR/MAHASISWA",
          statusPerkawinan: "BELUM KAWIN",
          statusHubungan: "ANAK",
          kewarganegaraan: "WNI",
          namaAyah: "BUDI WIDODO WIJAYA",
          namaIbu: "DEWI LESTARI WIJAYA",
        },
        {
          id: "a4",
          nik: "3174082209110004",
          nama: "NADIA PUTRI WIJAYA",
          jenisKelamin: "PEREMPUAN",
          tempatLahir: "JAKARTA",
          tanggalLahir: "2011-09-22",
          agama: "ISLAM",
          pendidikan: "SLTP / SEDERAJAT",
          pekerjaan: "PELAJAR/MAHASISWA",
          statusPerkawinan: "BELUM KAWIN",
          statusHubungan: "ANAK",
          kewarganegaraan: "WNI",
          namaAyah: "BUDI WIDODO WIJAYA",
          namaIbu: "DEWI LESTARI WIJAYA",
        },
      ],
    },
  },
  {
    label: "Keluarga Hartono",
    description: "KK 5 anggota — Yogyakarta",
    data: {
      noKK: "3404030101760002",
      alamat: {
        provinsi: "DI YOGYAKARTA",
        kabupaten: "KOTA YOGYAKARTA",
        kecamatan: "GONDOKUSUMAN",
        kelurahan: "SOSROMENDURAN",
        rt: "002",
        rw: "001",
        kodePos: "55271",
        alamatLengkap:
          "JL. MALIOBORO NO. 45 RT 002 RW 001 KEL. SOSROMENDURAN KEC. GONDOKUSUMAN",
      },
      kepalaKeluargaId: "b1",
      anggota: [
        {
          id: "b1",
          nik: "3404030101760003",
          nama: "AGUS HARTONO",
          jenisKelamin: "LAKI-LAKI",
          tempatLahir: "YOGYAKARTA",
          tanggalLahir: "1976-01-01",
          agama: "ISLAM",
          pendidikan: "SLTA / SEDERAJAT",
          pekerjaan: "WIRASWASTA",
          statusPerkawinan: "KAWIN",
          statusHubungan: "KEPALA KELUARGA",
          kewarganegaraan: "WNI",
          namaAyah: "HARTONO SENIOR",
          namaIbu: "SUMIATI",
        },
        {
          id: "b2",
          nik: "3404031510780004",
          nama: "RINI ASTUTI HARTONO",
          jenisKelamin: "PEREMPUAN",
          tempatLahir: "SOLO",
          tanggalLahir: "1978-10-15",
          agama: "ISLAM",
          pendidikan: "SLTA / SEDERAJAT",
          pekerjaan: "MENGURUS RUMAH TANGGA",
          statusPerkawinan: "KAWIN",
          statusHubungan: "ISTRI",
          kewarganegaraan: "WNI",
          namaAyah: "SUTRISNO",
          namaIbu: "NGATINEM",
        },
        {
          id: "b3",
          nik: "3404030705020005",
          nama: "BAGUS PRASETYO HARTONO",
          jenisKelamin: "LAKI-LAKI",
          tempatLahir: "YOGYAKARTA",
          tanggalLahir: "2002-05-07",
          agama: "ISLAM",
          pendidikan: "SLTA / SEDERAJAT",
          pekerjaan: "PELAJAR/MAHASISWA",
          statusPerkawinan: "BELUM KAWIN",
          statusHubungan: "ANAK",
          kewarganegaraan: "WNI",
          namaAyah: "AGUS HARTONO",
          namaIbu: "RINI ASTUTI HARTONO",
        },
        {
          id: "b4",
          nik: "3404031208050006",
          nama: "KIRANA DEWI HARTONO",
          jenisKelamin: "PEREMPUAN",
          tempatLahir: "YOGYAKARTA",
          tanggalLahir: "2005-08-12",
          agama: "ISLAM",
          pendidikan: "SLTP / SEDERAJAT",
          pekerjaan: "PELAJAR/MAHASISWA",
          statusPerkawinan: "BELUM KAWIN",
          statusHubungan: "ANAK",
          kewarganegaraan: "WNI",
          namaAyah: "AGUS HARTONO",
          namaIbu: "RINI ASTUTI HARTONO",
        },
      ],
    },
  },
];

// ============ DATA AWAL (sudah ada di database demo) ============

export const SEED_KK: Keluarga[] = [
  {
    id: "seed_1",
    ...SAMPLE_KK_LIST[0].data,
    createdBy: "demo",
    createdAt: "2026-06-10T08:30:00.000Z",
    updatedAt: "2026-06-10T08:30:00.000Z",
  } as Keluarga,
  {
    id: "seed_2",
    ...SAMPLE_KK_LIST[1].data,
    createdBy: "demo",
    createdAt: "2026-06-12T14:20:00.000Z",
    updatedAt: "2026-06-12T14:20:00.000Z",
  } as Keluarga,
];

// ============ VALIDATION HELPERS ============

export function isValidNIK(nik: string): boolean {
  return /^\d{16}$/.test(nik.trim());
}

export function isValidNoKK(noKK: string): boolean {
  return /^\d{16}$/.test(noKK.trim());
}

export function isValidTanggal(tanggal: string): boolean {
  if (!tanggal) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(tanggal)) return false;
  const d = new Date(tanggal);
  return !isNaN(d.getTime()) && d.getFullYear() > 1900;
}

export function isValidKodePos(kodePos: string): boolean {
  return /^\d{5}$/.test(kodePos.trim());
}

export function isDuplicateNIK(
  nik: string,
  keluargaList: Keluarga[],
  excludeId?: string,
): boolean {
  for (const kk of keluargaList) {
    for (const anggota of kk.anggota) {
      if (excludeId && anggota.id === excludeId) continue;
      if (anggota.nik === nik) return true;
    }
  }
  return false;
}

export function isDuplicateNoKK(
  noKK: string,
  keluargaList: Keluarga[],
  excludeId?: string,
): boolean {
  return keluargaList.some((kk) => kk.noKK === noKK && kk.id !== excludeId);
}

// Generate Excel/CSV dari data KK
export function exportToExcel(keluargaList: Keluarga[]): string {
  const headers = [
    "No. KK",
    "NIK",
    "Nama",
    "Jenis Kelamin",
    "Tempat Lahir",
    "Tanggal Lahir",
    "Agama",
    "Pendidikan",
    "Pekerjaan",
    "Status Perkawinan",
    "Status Hubungan",
    "Kewarganegaraan",
    "Nama Ayah",
    "Nama Ibu",
    "Provinsi",
    "Kabupaten",
    "Kecamatan",
    "Kelurahan",
    "RT",
    "RW",
    "Kode Pos",
    "Alamat Lengkap",
    "Tanggal Dibuat",
  ];

  const rows: string[][] = [headers];

  for (const kk of keluargaList) {
    for (const anggota of kk.anggota) {
      rows.push([
        kk.noKK,
        anggota.nik,
        anggota.nama,
        anggota.jenisKelamin,
        anggota.tempatLahir,
        anggota.tanggalLahir,
        anggota.agama,
        anggota.pendidikan,
        anggota.pekerjaan,
        anggota.statusPerkawinan,
        anggota.statusHubungan,
        anggota.kewarganegaraan,
        anggota.namaAyah,
        anggota.namaIbu,
        kk.alamat.provinsi,
        kk.alamat.kabupaten,
        kk.alamat.kecamatan,
        kk.alamat.kelurahan,
        kk.alamat.rt,
        kk.alamat.rw,
        kk.alamat.kodePos,
        kk.alamat.alamatLengkap,
        new Date(kk.createdAt).toLocaleDateString("id-ID"),
      ]);
    }
  }

  return rows
    .map((row) =>
      row
        .map((cell) => {
          const c = String(cell ?? "");
          if (c.includes(",") || c.includes('"') || c.includes("\n")) {
            return `"${c.replace(/"/g, '""')}"`;
          }
          return c;
        })
        .join(","),
    )
    .join("\n");
}
