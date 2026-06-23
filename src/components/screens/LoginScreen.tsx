"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ShieldCheck, Loader2 } from "lucide-react";

export function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const [email, setEmail] = useState("operator@demo.id");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Format email tidak valid");
      return;
    }
    if (password.length < 4) {
      setError("Password minimal 4 karakter");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login(email);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-emerald-600 to-emerald-700 text-white overflow-y-auto">
      <div className="px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm mb-4 ring-4 ring-white/10">
          <FileText className="w-10 h-10" strokeWidth={2.2} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">KK Scan</h1>
        <p className="text-emerald-100 text-sm">
          Input data Kartu Keluarga dalam hitungan detik
        </p>
      </div>

      <div className="flex-1 bg-background text-foreground rounded-t-3xl px-6 pt-8 pb-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-1">Selamat Datang</h2>
          <p className="text-sm text-muted-foreground">
            Masuk untuk mulai mengelola data Kartu Keluarga
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="h-12"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-semibold shadow-md"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          <Card className="bg-emerald-50 border-emerald-100">
            <CardContent className="p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-900">Demo Akun</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Email &amp; password apa saja yang valid bisa masuk untuk demo ini.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Belum punya akun?{" "}
          <span className="text-primary font-medium cursor-pointer">
            Hubungi admin
          </span>
        </p>
      </div>
    </div>
  );
}
