/**
 * OCR API Route untuk Kartu Keluarga
 * Multi-provider dengan fallback: Z.AI Vision -> Gemini Vision
 * Auto-deskew server-side + auto-fill dari NIK
 */

import { NextRequest, NextResponse } from "next/server";
import type { Keluarga, AnggotaKeluarga } from "@/lib/types";
import { deskewImageServer } from "@/lib/server-deskew";
import { parseNIK } from "@/lib/nik-parser";

export const runtime = "nodejs";
export const maxDuration = 120;

interface OCRRequest {
  image: string;
}

interface OCRResponse {
  success: boolean;
  data?: Omit<Keluarga, "id" | "createdBy" | "createdAt" | "updatedAt">;
  error?: string;
  provider?: string;
  rawResponse?: string;
  durationMs?: number;
  deskewInfo?: {
    detectedAngle: number;
    confidence: number;
    corrected: boolean;
    durationMs: number;
  };
}

const KK_EXTRACTION_PROMPT = `Anda adalah asisten ahli untuk membaca Kartu Keluarga (KK) Indonesia.

Tugas Anda: Lihat gambar Kartu Keluarga yang diupload, lalu ekstrak data ke format JSON terstruktur.

## ⚡ OPTIMASI PENTING - SKIP FIELD BERIKUT:
Field-field di bawah akan diisi OTOMATIS dari NIK di backend (lebih akurat & cepat).
**JANGAN baca field-field ini, cukup isi dengan string kosong "":**

Untuk setiap ANGGOTA:
- jenisKelamin: "" (akan diisi dari NIK)
- tempatLahir: "" (akan diisi dari NIK atau biarkan kosong)
- tanggalLahir: "" (akan diisi dari NIK)

Untuk ALAMAT KK:
- provinsi: "" (akan diisi dari NIK kepala keluarga)
- kabupaten: "" (akan diisi dari NIK kepala keluarga)
- kecamatan: "" (akan diisi dari NIK kepala keluarga)

**Fokus baca field ini saja:**
- noKK (16 digit)
- NIK setiap anggota (16 digit, SANGAT TELITI)
- Nama setiap anggota (HURUF KAPITAL)
- Alamat: kelurahan, RT, RW, kodePos, alamatLengkap
- Untuk setiap anggota: agama, pendidikan, pekerjaan, statusPerkawinan, statusHubungan, kewarganegaraan, namaAyah, namaIbu

## Aturan penting:
1. NIK WAJIB 16 digit angka. Baca dengan SANGAT TELITI. Jika ada karakter aneh (O, I, B, S, Z), ganti dengan angka (0, 1, 8, 5, 2).
2. Nama harus HURUF KAPITAL SEMUA.
3. Status hubungan: "KEPALA KELUARGA", "ISTRI", "SUAMI", "ANAK", "MENANTU", "CUCU", "ORANG TUA", "MERTUA", "FAMILI LAIN", "PEMBANTU", "LAINNYA".
4. Agama: "ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU", "LAINNYA".
5. Status perkawinan: "BELUM KAWIN", "KAWIN", "CERAI HIDUP", "CERAI MATI".
6. Pastikan minimal ada 1 anggota dengan status "KEPALA KELUARGA".
7. kepalaKeluargaId harus sama dengan id anggota yang ber-status "KEPALA KELUARGA".
8. Untuk field yang tidak terbaca, isi string kosong "".

## Output format (JSON saja, tanpa markdown, tanpa penjelasan):
{
  "noKK": "16 digit nomor KK",
  "alamat": {
    "provinsi": "",
    "kabupaten": "",
    "kecamatan": "",
    "kelurahan": "...",
    "rt": "...",
    "rw": "...",
    "kodePos": "5 digit",
    "alamatLengkap": "..."
  },
  "kepalaKeluargaId": "a1",
  "anggota": [
    {
      "id": "a1",
      "nik": "16 digit",
      "nama": "NAMA LENGKAP",
      "jenisKelamin": "",
      "tempatLahir": "",
      "tanggalLahir": "",
      "agama": "ISLAM",
      "pendidikan": "...",
      "pekerjaan": "...",
      "statusPerkawinan": "KAWIN",
      "statusHubungan": "KEPALA KELUARGA",
      "kewarganegaraan": "WNI",
      "namaAyah": "...",
      "namaIbu": "..."
    }
  ]
}

HANYA kembalikan JSON, tanpa penjelasan tambahan, tanpa markdown code blocks.`;

async function ocrWithZaiVision(
  imageDataUrl: string,
): Promise<{ content: string; provider: string }> {
  // Dynamic import
  const ZAI = (await import("z-ai-web-dev-sdk")).default;

  // ============================================================
  // Resolve Z.AI config (mirip pola sipbd-mempawah/ai-sdk.ts):
  // 1. Environment variables (works on Vercel) — PRIORITY
  // 2. File system (.z-ai-config) — works in sandbox
  // 3. SDK auto-discovery (ZAI.create()) — works in sandbox
  // ============================================================

  const baseUrl = process.env.ZAI_BASE_URL;
  const apiKey = process.env.ZAI_API_KEY;

  let zai: InstanceType<typeof ZAI>;

  if (baseUrl && apiKey) {
    // Priority 1: Use env vars (production / Vercel)
    const config: Record<string, string> = { baseUrl, apiKey };
    if (process.env.ZAI_CHAT_ID) config.chatId = process.env.ZAI_CHAT_ID;
    if (process.env.ZAI_USER_ID) config.userId = process.env.ZAI_USER_ID;
    if (process.env.ZAI_TOKEN) config.token = process.env.ZAI_TOKEN;
    zai = new ZAI(config as any);
    console.log(
      `[OCR] Z.AI initialized via env vars: baseUrl=${baseUrl.substring(0, 30)}...`,
    );
  } else {
    // Priority 2 & 3: Try SDK auto-discovery (works in sandbox with .z-ai-config)
    try {
      zai = await ZAI.create();
      console.log("[OCR] Z.AI initialized via SDK auto-discovery (sandbox mode)");
    } catch (sdkError) {
      const errMsg =
        sdkError instanceof Error ? sdkError.message : "Unknown error";
      throw new Error(
        `Z.AI config not found: ${errMsg.substring(0, 200)}. ` +
          `Set ZAI_BASE_URL=https://api.z.ai/api/v1 and ZAI_API_KEY in env vars. ` +
          `Get API key at https://chat.z.ai → Settings → API Keys. ` +
          `(JANGAN pakai https://chat.z.ai/api/v1 — itu web frontend!)`,
      );
    }
  }

  // Timeout 50 detik — kalau lebih, lempar error agar fallback jalan
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error("Z.AI timeout (50s) — coba fallback provider")),
      50000,
    );
  });

  const response = (await Promise.race([
    zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: KK_EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    }),
    timeoutPromise,
  ])) as any;

  // Log response structure untuk debugging (tanpa expose content)
  console.log(
    `[OCR] Z.AI response type: ${typeof response}, keys: ${Object.keys(response || {}).join(",")}`,
  );

  // Handle Z.AI error response (format: {code, msg, success: false})
  if (response && (response.success === false || response.code)) {
    const errMsg = response.msg || response.message || "Unknown Z.AI error";
    const code = response.code || "unknown";
    console.error(`[OCR] Z.AI API error code=${code}:`, errMsg.substring(0, 300));

    // Beri pesan error yang helpful
    let helpfulError = `Z.AI API error (code ${code}): ${errMsg}`;
    if (code === 1000 || code === 401 || errMsg.includes("Authentication")) {
      helpfulError = `Z.AI API key tidak valid atau expired. Cek ZAI_API_KEY di Vercel env vars. Detail: ${errMsg}`;
    } else if (code === 404 || errMsg.includes("not found")) {
      helpfulError = `Z.AI API endpoint tidak ditemukan. Pastikan ZAI_BASE_URL=https://api.z.ai/api/v1. Detail: ${errMsg}`;
    } else if (code === 429 || errMsg.includes("rate")) {
      helpfulError = `Z.AI rate limit tercapai. Coba lagi nanti atau pakai Gemini fallback. Detail: ${errMsg}`;
    }
    throw new Error(helpfulError);
  }

  // Handle berbagai format response Z.AI yang sukses
  let content: string | undefined;
  if (response?.choices?.[0]?.message?.content) {
    content = response.choices[0].message.content;
  } else if (response?.choices?.[0]?.text) {
    content = response.choices[0].text;
  } else if (response?.output?.text) {
    content = response.output.text;
  } else if (typeof response === "string") {
    content = response;
  } else if (response?.data?.choices?.[0]?.message?.content) {
    content = response.data.choices[0].message.content;
  } else {
    console.error(
      "[OCR] Z.AI response tidak terduga:",
      JSON.stringify(response).substring(0, 500),
    );
    throw new Error(
      `Z.AI response format tidak dikenali. Keys: ${Object.keys(response || {}).join(",")}`,
    );
  }

  if (!content) {
    throw new Error("Z.AI Vision mengembalikan response kosong");
  }
  return { content, provider: "Z.AI GLM-4V" };
}

async function ocrWithGeminiVision(
  imageDataUrl: string,
): Promise<{ content: string; provider: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tidak dikonfigurasi");
  }

  const match = imageDataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) throw new Error("Format data URL tidak valid");
  const mimeType = match[1];
  const base64Data = match[2];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: KK_EXTRACTION_PROMPT },
          { inline_data: { mime_type: mimeType, data: base64Data } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  const content = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error("Gemini mengembalikan response kosong");
  }
  return { content, provider: "Google Gemini 2.0 Flash" };
}

function parseJsonFromResponse(raw: string): unknown {
  const attempts = [
    raw.trim(),
    raw.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim(),
    (() => {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return raw.slice(start, end + 1).trim();
      }
      return raw;
    })(),
  ];

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      // try next
    }
  }
  throw new Error("Tidak dapat parse JSON dari response AI");
}

function normalizeKK(
  raw: unknown,
): Omit<Keluarga, "id" | "createdBy" | "createdAt" | "updatedAt"> {
  if (!raw || typeof raw !== "object") {
    throw new Error("Response bukan object JSON");
  }
  const obj = raw as Record<string, unknown>;
  const alamatRaw = (obj.alamat as Record<string, unknown>) || {};

  const anggotaRaw = Array.isArray(obj.anggota) ? obj.anggota : [];
  if (anggotaRaw.length === 0) {
    throw new Error("Tidak ada anggota keluarga terdeteksi");
  }

  const anggota: AnggotaKeluarga[] = anggotaRaw.map(
    (a, idx): AnggotaKeluarga => {
      const an = (a as Record<string, unknown>) || {};
      const nik = String(an.nik || "").replace(/\D/g, "").slice(0, 16);

      let jenisKelamin: "LAKI-LAKI" | "PEREMPUAN" =
        String(an.jenisKelamin || "").toUpperCase() === "PEREMPUAN"
          ? "PEREMPUAN"
          : String(an.jenisKelamin || "").toUpperCase() === "LAKI-LAKI"
            ? "LAKI-LAKI"
            : "LAKI-LAKI";
      let tanggalLahir = String(an.tanggalLahir || "").trim();

      if (nik.length === 16) {
        const parsed = parseNIK(nik);
        if (parsed.isValid) {
          if (parsed.jenisKelamin) {
            jenisKelamin = parsed.jenisKelamin;
          }
          if (parsed.tanggalLahirISO) {
            tanggalLahir = parsed.tanggalLahirISO;
          }
          console.log(
            `[OCR] Auto-fill dari NIK ${nik}: gender=${jenisKelamin}, tanggal=${tanggalLahir}`,
          );
        } else if (parsed.tanggalLahirISO) {
          tanggalLahir = parsed.tanggalLahirISO;
          console.log(
            `[OCR] Auto-fill tanggal lahir dari NIK ${nik}: ${tanggalLahir} (warning: ${parsed.errors.join(", ")})`,
          );
        }
      }

      return {
        id: String(an.id || `a${idx + 1}`),
        nik,
        nama: String(an.nama || "").toUpperCase().trim(),
        jenisKelamin,
        tempatLahir: String(an.tempatLahir || "").toUpperCase().trim(),
        tanggalLahir,
        agama: String(an.agama || "ISLAM").toUpperCase().trim(),
        pendidikan: String(an.pendidikan || "").toUpperCase().trim(),
        pekerjaan: String(an.pekerjaan || "").toUpperCase().trim(),
        statusPerkawinan: String(an.statusPerkawinan || "").toUpperCase().trim(),
        statusHubungan: String(an.statusHubungan || "ANAK").toUpperCase().trim(),
        kewarganegaraan: String(an.kewarganegaraan || "WNI").toUpperCase().trim(),
        namaAyah: String(an.namaAyah || "").toUpperCase().trim(),
        namaIbu: String(an.namaIbu || "").toUpperCase().trim(),
      };
    },
  );

  let kepala = anggota.find((a) => a.statusHubungan === "KEPALA KELUARGA");
  if (!kepala) {
    kepala = anggota[0];
    kepala.statusHubungan = "KEPALA KELUARGA";
  }

  let provinsiFromNIK = "";
  let kabupatenFromNIK = "";
  let kecamatanFromNIK = "";

  if (kepala.nik.length === 16) {
    const parsedKepala = parseNIK(kepala.nik);
    if (parsedKepala.isValid) {
      provinsiFromNIK = parsedKepala.provinsiName || "";
      kabupatenFromNIK = parsedKepala.kabupatenName || "";
      kecamatanFromNIK = parsedKepala.kecamatanName || "";
      console.log(
        `[OCR] Auto-fill alamat dari NIK kepala keluarga ${kepala.nik}: provinsi=${provinsiFromNIK}, kabupaten=${kabupatenFromNIK}, kecamatan=${kecamatanFromNIK}`,
      );
    }
  }

  const finalProvinsi =
    provinsiFromNIK || String(alamatRaw.provinsi || "").toUpperCase().trim();
  const finalKabupaten =
    kabupatenFromNIK || String(alamatRaw.kabupaten || "").toUpperCase().trim();
  const finalKecamatan =
    kecamatanFromNIK || String(alamatRaw.kecamatan || "").toUpperCase().trim();

  return {
    noKK: String(obj.noKK || "").replace(/\D/g, "").slice(0, 16),
    alamat: {
      provinsi: finalProvinsi,
      kabupaten: finalKabupaten,
      kecamatan: finalKecamatan,
      kelurahan: String(alamatRaw.kelurahan || "").toUpperCase().trim(),
      rt: String(alamatRaw.rt || "").trim(),
      rw: String(alamatRaw.rw || "").trim(),
      kodePos: String(alamatRaw.kodePos || "").replace(/\D/g, "").slice(0, 5),
      alamatLengkap: String(alamatRaw.alamatLengkap || "").toUpperCase().trim(),
    },
    kepalaKeluargaId: kepala.id,
    anggota,
  };
}

export async function POST(req: NextRequest): Promise<NextResponse<OCRResponse>> {
  const startTime = Date.now();

  try {
    const body = (await req.json()) as OCRRequest;
    if (!body.image || !body.image.startsWith("data:image/")) {
      return NextResponse.json(
        { success: false, error: "Image data URL tidak valid" },
        { status: 400 },
      );
    }

    console.log("[OCR] Memulai OCR, image size:", body.image.length, "chars");

    let processedImage = body.image;
    let deskewInfo: OCRResponse["deskewInfo"] | undefined;

    try {
      const deskewStart = Date.now();
      const deskewResult = await deskewImageServer(body.image, {
        minConfidence: 0.02,
        minAngleToCorrect: 0.5,
      });
      const deskewDuration = Date.now() - deskewStart;

      deskewInfo = {
        detectedAngle: deskewResult.detectedAngle,
        confidence: deskewResult.confidence,
        corrected: deskewResult.corrected,
        durationMs: deskewDuration,
      };

      if (deskewResult.corrected) {
        console.log(
          `[OCR] ✅ Auto-deskew: corrected ${deskewResult.detectedAngle.toFixed(2)}° in ${deskewDuration}ms`,
        );
        processedImage = deskewResult.deskewedDataUrl;
      } else {
        console.log(
          `[OCR] Auto-deskew: no correction needed (angle=${deskewResult.detectedAngle.toFixed(2)}°, confidence=${deskewResult.confidence.toFixed(3)})`,
        );
      }
    } catch (err) {
      console.warn(
        "[OCR] Deskew gagal, lanjut dengan gambar asli:",
        err instanceof Error ? err.message : String(err),
      );
    }

    const providers: Array<{
      name: string;
      fn: () => Promise<{ content: string; provider: string }>;
    }> = [
      { name: "Z.AI", fn: () => ocrWithZaiVision(processedImage) },
      ...(process.env.GEMINI_API_KEY
        ? [{ name: "Gemini", fn: () => ocrWithGeminiVision(processedImage) }]
        : []),
    ];

    let lastError: string | undefined;
    let rawContent: string | undefined;
    let usedProvider: string | undefined;

    for (const provider of providers) {
      try {
        console.log(`[OCR] Mencoba provider: ${provider.name}`);
        const result = await provider.fn();
        rawContent = result.content;
        usedProvider = result.provider;
        console.log(
          `[OCR] ✅ ${provider.name} berhasil, response length:`,
          rawContent.length,
        );
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[OCR] ❌ ${provider.name} gagal:`, msg.slice(0, 200));
        lastError = msg;
      }
    }

    if (!rawContent) {
      return NextResponse.json(
        {
          success: false,
          error: `Semua provider gagal. Error terakhir: ${lastError}`,
          durationMs: Date.now() - startTime,
          deskewInfo,
        },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = parseJsonFromResponse(rawContent);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          success: false,
          error: `Gagal parse JSON: ${msg}`,
          rawResponse: rawContent.slice(0, 500),
          provider: usedProvider,
          durationMs: Date.now() - startTime,
          deskewInfo,
        },
        { status: 422 },
      );
    }

    let kkData: Omit<Keluarga, "id" | "createdBy" | "createdAt" | "updatedAt">;
    try {
      kkData = normalizeKK(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          success: false,
          error: `Data KK tidak valid: ${msg}`,
          rawResponse: rawContent.slice(0, 500),
          provider: usedProvider,
          durationMs: Date.now() - startTime,
          deskewInfo,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      data: kkData,
      provider: usedProvider,
      durationMs: Date.now() - startTime,
      deskewInfo,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OCR] Unhandled error:", msg);
    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${msg}`,
        durationMs: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  // Cek status Z.AI (env vars atau file)
  const zaiBaseUrl = process.env.ZAI_BASE_URL;
  const zaiApiKey = process.env.ZAI_API_KEY;
  const zaiStatus = zaiBaseUrl && zaiApiKey ? "available (env)" : "available (sandbox auto)";

  return NextResponse.json({
    status: "ok",
    providers: {
      zai: zaiStatus,
      gemini: process.env.GEMINI_API_KEY ? "available" : "not configured",
    },
    timestamp: new Date().toISOString(),
  });
}
