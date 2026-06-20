/**
 * Generate sample KK images (PNG) dari SVG template
 * untuk testing OCR AI Vision.
 * Run: bun /home/z/my-project/scripts/generate-kk-samples.ts
 */
import sharp from "sharp";
import { join } from "path";

interface KKData {
  noKK: string;
  alamat: {
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    kelurahan: string;
    rt: string;
    rw: string;
    kodePos: string;
    alamatLengkap: string;
  };
  anggota: Array<{
    no: number;
    nik: string;
    nama: string;
    jk: string;
    tempatLahir: string;
    tanggalLahir: string;
    agama: string;
    pendidikan: string;
    pekerjaan: string;
    statusPerkawinan: string;
    statusHubungan: string;
  }>;
}

const SAMPLE_DATA: KKData[] = [
  {
    noKK: "3174081204800001",
    alamat: {
      provinsi: "DKI JAKARTA",
      kabupaten: "JAKARTA SELATAN",
      kecamatan: "KEBAYORAN BARU",
      kelurahan: "SELONG",
      rt: "005",
      rw: "008",
      kodePos: "12110",
      alamatLengkap: "JL. SENOPATI NO. 12 RT 005 RW 008",
    },
    anggota: [
      { no: 1, nik: "3174081204800002", nama: "BUDI WIDODO WIJAYA", jk: "LAKI-LAKI", tempatLahir: "JAKARTA", tanggalLahir: "12-04-1980", agama: "ISLAM", pendidikan: "SARJANA (S1)", pekerjaan: "KARYAWAN SWASTA", statusPerkawinan: "KAWIN", statusHubungan: "KEPALA KELUARGA" },
      { no: 2, nik: "3174084503820001", nama: "DEWI LESTARI WIJAYA", jk: "PEREMPUAN", tempatLahir: "BANDUNG", tanggalLahir: "05-03-1982", agama: "ISLAM", pendidikan: "SARJANA (S1)", pekerjaan: "GURU", statusPerkawinan: "KAWIN", statusHubungan: "ISTRI" },
      { no: 3, nik: "3174081507080003", nama: "RAFI PRATAMA WIJAYA", jk: "LAKI-LAKI", tempatLahir: "JAKARTA", tanggalLahir: "15-07-2008", agama: "ISLAM", pendidikan: "SLTA / SEDERAJAT", pekerjaan: "PELAJAR/MAHASISWA", statusPerkawinan: "BELUM KAWIN", statusHubungan: "ANAK" },
      { no: 4, nik: "3174082209110004", nama: "NADIA PUTRI WIJAYA", jk: "PEREMPUAN", tempatLahir: "JAKARTA", tanggalLahir: "22-09-2011", agama: "ISLAM", pendidikan: "SLTP / SEDERAJAT", pekerjaan: "PELAJAR/MAHASISWA", statusPerkawinan: "BELUM KAWIN", statusHubungan: "ANAK" },
    ],
  },
  {
    noKK: "3404030101760002",
    alamat: {
      provinsi: "DI YOGYAKARTA",
      kabupaten: "KOTA YOGYAKARTA",
      kecamatan: "GONDOKUSUMAN",
      kelurahan: "SOSROMENDURAN",
      rt: "002",
      rw: "001",
      kodePos: "55271",
      alamatLengkap: "JL. MALIOBORO NO. 45 RT 002 RW 001",
    },
    anggota: [
      { no: 1, nik: "3404030101760003", nama: "AGUS HARTONO", jk: "LAKI-LAKI", tempatLahir: "YOGYAKARTA", tanggalLahir: "01-01-1976", agama: "ISLAM", pendidikan: "SLTA / SEDERAJAT", pekerjaan: "WIRASWASTA", statusPerkawinan: "KAWIN", statusHubungan: "KEPALA KELUARGA" },
      { no: 2, nik: "3404031510780004", nama: "RINI ASTUTI HARTONO", jk: "PEREMPUAN", tempatLahir: "SOLO", tanggalLahir: "15-10-1978", agama: "ISLAM", pendidikan: "SLTA / SEDERAJAT", pekerjaan: "MENGURUS RUMAH TANGGA", statusPerkawinan: "KAWIN", statusHubungan: "ISTRI" },
      { no: 3, nik: "3404030705020005", nama: "BAGUS PRASETYO HARTONO", jk: "LAKI-LAKI", tempatLahir: "YOGYAKARTA", tanggalLahir: "07-05-2002", agama: "ISLAM", pendidikan: "SLTA / SEDERAJAT", pekerjaan: "PELAJAR/MAHASISWA", statusPerkawinan: "BELUM KAWIN", statusHubungan: "ANAK" },
      { no: 4, nik: "3404031208050006", nama: "KIRANA DEWI HARTONO", jk: "PEREMPUAN", tempatLahir: "YOGYAKARTA", tanggalLahir: "12-08-2005", agama: "ISLAM", pendidikan: "SLTP / SEDERAJAT", pekerjaan: "PELAJAR/MAHASISWA", statusPerkawinan: "BELUM KAWIN", statusHubungan: "ANAK" },
    ],
  },
];

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateKKSvg(data: KKData): string {
  const rowHeight = 32;
  const headerHeight = 230;
  const tableTop = headerHeight;
  const tableHeight = 40 + data.anggota.length * rowHeight;
  const width = 1000;
  const height = tableTop + tableHeight + 30;

  const colWidths = [40, 130, 170, 90, 90, 90, 70, 110, 110, 90, 110];
  const colX: number[] = [0];
  for (let i = 0; i < colWidths.length; i++) {
    colX.push(colX[i] + colWidths[i]);
  }

  const headers = ["No.", "NIK", "Nama Lengkap", "Jenis Kelamin", "Tempat Lahir", "Tanggal Lahir", "Agama", "Pendidikan", "Pekerjaan", "Status Perkawinan", "Status Hubungan"];

  let tableHeaderSvg = "";
  for (let i = 0; i < headers.length; i++) {
    tableHeaderSvg += `<rect x="${colX[i]}" y="0" width="${colWidths[i]}" height="40" fill="#e8f5e9" stroke="#000" stroke-width="0.8"/>`;
    tableHeaderSvg += `<text x="${colX[i] + colWidths[i] / 2}" y="24" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${escapeXml(headers[i])}</text>`;
  }

  let anggotaRowsSvg = "";
  data.anggota.forEach((anggota, idx) => {
    const y = 40 + idx * rowHeight;
    const rowBg = idx % 2 === 0 ? "#ffffff" : "#f9f9f9";
    anggotaRowsSvg += `<rect x="0" y="${y}" width="${width}" height="${rowHeight}" fill="${rowBg}" stroke="#000" stroke-width="0.4"/>`;

    const cells = [String(anggota.no), anggota.nik, anggota.nama, anggota.jk, anggota.tempatLahir, anggota.tanggalLahir, anggota.agama, anggota.pendidikan, anggota.pekerjaan, anggota.statusPerkawinan, anggota.statusHubungan];

    for (let i = 0; i < cells.length; i++) {
      anggotaRowsSvg += `<rect x="${colX[i]}" y="${y}" width="${colWidths[i]}" height="${rowHeight}" fill="none" stroke="#000" stroke-width="0.4"/>`;
      const fontSize = i === 1 ? 10 : 11;
      const text = escapeXml(cells[i]);
      const maxChars = Math.floor(colWidths[i] / 6);
      const displayText = text.length > maxChars ? text.slice(0, maxChars - 1) + ".." : text;
      anggotaRowsSvg += `<text x="${colX[i] + 4}" y="${y + 20}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${i === 2 ? "bold" : "normal"}">${displayText}</text>`;
    }
  });

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <rect x="0" y="0" width="${width}" height="80" fill="#1b5e20"/>
  <text x="${width / 2}" y="40" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">KARTU KELUARGA</text>
  <text x="${width / 2}" y="68" font-family="Arial, sans-serif" font-size="14" fill="#c8e6c9" text-anchor="middle">REPUBLIK INDONESIA</text>
  <rect x="40" y="100" width="350" height="40" fill="#fff" stroke="#000" stroke-width="1"/>
  <text x="50" y="118" font-family="Arial, sans-serif" font-size="11" fill="#000">NO. KK</text>
  <text x="50" y="135" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#000">${escapeXml(data.noKK)}</text>
  <rect x="40" y="150" width="920" height="40" fill="#e8f5e9" stroke="#000" stroke-width="1"/>
  <text x="50" y="175" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#1b5e20">ALAMAT: ${escapeXml(data.alamat.alamatLengkap)}, RT ${data.alamat.rt} / RW ${data.alamat.rw}</text>
  <text x="50" y="${205}" font-family="Arial, sans-serif" font-size="11" fill="#000">DESA/KELURAHAN: ${escapeXml(data.alamat.kelurahan)}</text>
  <text x="350" y="${205}" font-family="Arial, sans-serif" font-size="11" fill="#000">KECAMATAN: ${escapeXml(data.alamat.kecamatan)}</text>
  <text x="650" y="${205}" font-family="Arial, sans-serif" font-size="11" fill="#000">KABUPATEN: ${escapeXml(data.alamat.kabupaten)}</text>
  <text x="50" y="${220}" font-family="Arial, sans-serif" font-size="11" fill="#000">PROVINSI: ${escapeXml(data.alamat.provinsi)}</text>
  <text x="350" y="${220}" font-family="Arial, sans-serif" font-size="11" fill="#000">KODE POS: ${escapeXml(data.alamat.kodePos)}</text>
  <g transform="translate(40, ${tableTop + 30})">
    ${tableHeaderSvg}
    ${anggotaRowsSvg}
  </g>
</svg>`;
}

async function generateAll() {
  const outputDir = join(process.cwd(), "public", "samples");
  console.log("Generating sample KK images...");

  for (let i = 0; i < SAMPLE_DATA.length; i++) {
    const data = SAMPLE_DATA[i];
    const svg = generateKKSvg(data);
    const filename = `kk-sample-${i + 1}.png`;
    const outputPath = join(outputDir, filename);
    await sharp(Buffer.from(svg)).png().toFile(outputPath);
    console.log(`✅ Generated: ${outputPath} (KK: ${data.noKK})`);
  }

  console.log("Done!");
}

generateAll().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
