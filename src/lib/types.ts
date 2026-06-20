// Tipe data utama aplikasi KK Scanner

export type JenisKelamin = "LAKI-LAKI" | "PEREMPUAN";

export type StatusHubungan =
  | "KEPALA KELUARGA"
  | "ISTRI"
  | "SUAMI"
  | "ANAK"
  | "MENANTU"
  | "CUCU"
  | "ORANG TUA"
  | "MERTUA"
  | "FAMILI LAIN"
  | "PEMBANTU"
  | "LAINNYA";

export type Agama =
  | "ISLAM"
  | "KRISTEN"
  | "KATOLIK"
  | "HINDU"
  | "BUDDHA"
  | "KONGHUCU"
  | "LAINNYA";

export interface AnggotaKeluarga {
  id: string;
  nik: string;
  nama: string;
  jenisKelamin: JenisKelamin;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  agama: Agama | string;
  pendidikan: string;
  pekerjaan: string;
  statusPerkawinan: string;
  statusHubungan: StatusHubungan | string;
  kewarganegaraan: string;
  namaAyah: string;
  namaIbu: string;
  noPasspor?: string;
  noKitap?: string;
}

export interface Alamat {
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  rt: string;
  rw: string;
  kodePos: string;
  alamatLengkap: string;
}

export interface Keluarga {
  id: string;
  noKK: string;
  alamat: Alamat;
  kepalaKeluargaId: string;
  anggota: AnggotaKeluarga[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "operator";
}

export type ScreenName =
  | "login"
  | "home"
  | "scan"
  | "processing"
  | "review"
  | "detail"
  | "settings";
