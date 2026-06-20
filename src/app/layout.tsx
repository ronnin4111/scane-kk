import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KK Scan — Aplikasi Input Data Kartu Keluarga",
  description:
    "Foto KK, AI memproses, data tersimpan otomatis. Demo interaktif aplikasi mobile untuk input data Kartu Keluarga dengan teknologi OCR AI.",
  keywords: [
    "KK Scan",
    "Kartu Keluarga",
    "OCR",
    "Gemini",
    "Indonesia",
    "Input Data",
  ],
  authors: [{ name: "KK Scan" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
