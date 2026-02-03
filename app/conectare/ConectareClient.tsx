"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ConectareClient({ next }: { next: string }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Dacă e deja logat -> îl trimitem direct la next
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data.session) router.replace(next);
      setChecking(false);
    })();
    return () => {
      alive = false;
    };
  }, [router, next]);

  async function login() {
    setErr(null);

    const e = email.trim();
    const p = password.trim();
    if (!e || !p) {
      setErr("Completează email și parola.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: e,
        password: p,
      });

      if (error) throw new Error(error.message);

      router.push(next);
    } catch (e: any) {
      setErr(e?.message ?? "Eroare necunoscută.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 py-16">
        <div className="text-slate-700 font-semibold">Se verifică sesiunea...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-black/5 p-6 md:p-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">Conectare</h1>
          <p className="mt-2 text-slate-600 text-sm">
            Intră cu email și parolă. Rămâi logat.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block font-bold text-slate-900">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: nume@email.com"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-900">Parolă</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="parola ta"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoComplete="current-password"
            />
          </div>

          {err && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
              {err}
            </div>
          )}

          <button
            onClick={login}
            disabled={loading}
            className="w-full rounded-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 px-8 py-4 text-lg font-extrabold text-white shadow-lg"
          >
            {loading ? "Se conectează..." : "Conectare"}
          </button>

          <p className="text-center text-sm text-slate-600">
            N-ai cont?{" "}
            <Link
              className="text-orange-700 font-bold underline"
              href={`/inregistrare?next=${encodeURIComponent(next)}`}
            >
              Înregistrare
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}