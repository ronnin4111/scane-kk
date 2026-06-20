/**
 * Generate TypeScript file KECAMATAN_MAP dari Kemendagri data
 * Output: src/lib/kecamatan-data.ts
 */
import { readFileSync, writeFileSync } from "fs";

interface Kecamatan {
  code6: string;
  name: string;
}

function parseCSV(csvContent: string): Kecamatan[] {
  const lines = csvContent.trim().split("\n");
  const kecamatan: Kecamatan[] = [];

  for (const line of lines) {
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const code6 = parts[0].trim();
    const name = parts.slice(1).join(",").trim();
    if (code6.length !== 6 || !/^\d+$/.test(code6)) continue;
    kecamatan.push({ code6, name });
  }

  return kecamatan;
}

function titleCase(s: string): string {
  return s.toUpperCase().trim();
}

function escapeForTS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function generateTS(kecamatan: Kecamatan[]): string {
  const finalMap: Record<string, string> = {};
  for (const k of kecamatan) {
    finalMap[k.code6] = titleCase(k.name);
  }

  const entries = Object.entries(finalMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, name]) => `  "${code}": "${escapeForTS(name)}",`)
    .join("\n");

  return `/**
 * Database Kecamatan Indonesia (Kemendagri)
 *
 * Sumber: edwin/database-wilayah-kemendagri (data Kemendagri update 2021)
 * Total: ${kecamatan.length} kecamatan
 *
 * Key: 6-digit kode kecamatan (cocok dengan 6 digit pertama NIK Indonesia)
 * Value: Nama kecamatan (UPPERCASE)
 *
 * Generated at: ${new Date().toISOString()}
 */

export const KECAMATAN_MAP: Record<string, string> = {
${entries}
};

export function getKecamatanName(code6: string): string {
  if (!code6 || code6.length !== 6) return "";
  return KECAMATAN_MAP[code6] || "";
}

export function getKecamatanFromNIK(nik: string): string {
  const cleanNik = nik.replace(/\\D/g, "");
  if (cleanNik.length !== 16) return "";
  return getKecamatanName(cleanNik.substring(0, 6));
}
`;
}

async function main() {
  const csvPath = "/tmp/kecamatan-kemendagri.csv";
  const outputPath = "/home/z/my-project/src/lib/kecamatan-data.ts";

  const csvContent = readFileSync(csvPath, "utf-8");
  const kecamatan = parseCSV(csvContent);
  console.log(`Parsed ${kecamatan.length} kecamatan`);

  const tsContent = generateTS(kecamatan);
  writeFileSync(outputPath, tsContent);

  const sizeKB = (tsContent.length / 1024).toFixed(1);
  console.log(`✅ Done! Output: ${outputPath} (${sizeKB} KB)`);

  console.log("\n=== Verification ===");
  const testNIKs = [
    "6102181505480003",
    "3174081204800002",
    "3404030101760003",
  ];
  const map: Record<string, string> = {};
  for (const k of kecamatan) {
    map[k.code6] = titleCase(k.name);
  }
  for (const nik of testNIKs) {
    const code6 = nik.substring(0, 6);
    console.log(`NIK ${nik} → ${map[code6] || "(tidak ditemukan)"}`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
