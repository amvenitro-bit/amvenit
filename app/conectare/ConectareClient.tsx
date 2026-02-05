"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ConectareClient({ next }: { next: string }) {
  const router = useRouter();

  const backHref = useMemo(() => {
    // dacă next e gol/invalid -> home
    if (!next || typeof next !== "string") return "/";
    return next;
  }, [next]);

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

  return (
    <main className="min-h-screen relative px-6 py-10 overflow-hidden">
      {/* BACKGROUND identic cu /comenzi */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      <div className="max-w-md mx-auto">
        {/* TOP: Înapoi identic cu /comenzi */}
        <div className="text-center">
          <Link
            href={backHref}
            className="inline-block text-sm font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-4"
          >
            ← Înapoi
          </Link>

          <h1 className="mt-6 text-5xl font-extrabold text-white">amvenit.ro</h1>
          <p className="mt-3 text-white/80">Conectare</p>
        </div>

        <div className="mt-10 bg-white/85 backdrop-blur rounded-3xl shadow-xl border border-black/5 p-6 md:p-8">
          {checking ? (
            <div className="text-center text-slate-700 font-semibold">
              Se verifică sesiunea...
            </div>
          ) : (
            <>
              <div className="space-y-4">
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

                <p className="text-center text-sm text-slate-700">
                  N-ai cont?{" "}
                  <Link
                    className="text-orange-700 font-bold underline"
                    href={`/inregistrare?next=${encodeURIComponent(next)}`}
                  >
                    Înregistrare
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}