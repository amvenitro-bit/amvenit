"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "client" | "courier";

function normalizePhone(raw: string) {
  let cleaned = raw.trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("07")) cleaned = "+4" + cleaned;      // 07xxxxxxxx -> +407xxxxxxxx
  if (cleaned.startsWith("0040")) cleaned = "+40" + cleaned.slice(4);
  if (cleaned.startsWith("40") && !cleaned.startsWith("+")) cleaned = "+" + cleaned;

  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return cleaned;
}

export default function InregistrareClient({ next }: { next: string }) {
  const router = useRouter();

  const backHref = useMemo(() => {
    if (!next || typeof next !== "string") return "/";
    return next;
  }, [next]);

  const [role, setRole] = useState<Role>("client");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Dacă e deja logat -> îl trimitem direct la next
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data.session) {
        router.replace(next);
        return;
      }
      setChecking(false);
    })();
    return () => {
      alive = false;
    };
  }, [router, next]);

  async function register() {
    setErr(null);

    const n = fullName.trim();
    const phRaw = phone.trim();
    const ph = normalizePhone(phRaw);

    const e = email.trim();
    const p1 = password.trim();
    const p2 = password2.trim();

    if (!n) return setErr("Completează Nume.");
    if (!ph) return setErr("Telefon invalid. Accept: 07 / +40 / 0040 (minim 10 cifre).");

    if (role === "courier") {
      const vp = vehiclePlate.trim();
      if (vp.length < 3) return setErr("Completează numărul de înmatriculare.");
    }

    if (!e || !p1 || !p2) return setErr("Completează Email + Parola + Confirmă parola.");
    if (p1.length < 6) return setErr("Parola trebuie să aibă minim 6 caractere.");
    if (p1 !== p2) return setErr("Parolele nu coincid.");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password: p1,
      });
      if (error) throw new Error(error.message);

      const user = data.user;
      if (!user) throw new Error("Nu s-a creat userul. Încearcă din nou.");

      // scriem profilul
      const { error: pErr } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          role,
          full_name: n,
          phone: ph,
          vehicle_plate: role === "courier" ? vehiclePlate.trim() : null,
        },
        { onConflict: "id" }
      );
      if (pErr) throw new Error(pErr.message);

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
        {/* TOP */}
        <div className="text-center">
          <Link
            href={backHref}
            className="inline-block text-sm font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-4"
          >
            ← Înapoi
          </Link>

          <h1 className="mt-6 text-5xl font-extrabold text-white">amvenit.ro</h1>
          <p className="mt-3 text-white/80">Înregistrare</p>
        </div>

        <div className="mt-10 bg-white/85 backdrop-blur rounded-3xl shadow-xl border border-black/5 p-6 md:p-8">
          {checking ? (
            <div className="text-center text-slate-700 font-semibold">
              Se verifică sesiunea...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Alege rol */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-extrabold text-slate-900">Te înregistrezi ca:</div>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={`flex-1 rounded-full px-4 py-3 font-extrabold ${
                      role === "client"
                        ? "bg-orange-600 text-white"
                        : "bg-white border border-slate-200 text-slate-800"
                    }`}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("courier")}
                    className={`flex-1 rounded-full px-4 py-3 font-extrabold ${
                      role === "courier"
                        ? "bg-orange-600 text-white"
                        : "bg-white border border-slate-200 text-slate-800"
                    }`}
                  >
                    Livrator
                  </button>
                </div>
              </div>

              {/* Nume */}
              <div>
                <label className="block font-bold text-slate-900">Nume</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex: Laurențiu"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoComplete="name"
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="block font-bold text-slate-900">Telefon</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07xxxxxxxx / +40xxxxxxxxx / 0040xxxxxxxxx"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoComplete="tel"
                />
              </div>

              {/* Nr înmatriculare (doar livrator) */}
              {role === "courier" && (
                <div>
                  <label className="block font-bold text-slate-900">
                    Număr de înmatriculare
                  </label>
                  <input
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="ex: TR 12 ABC"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* Email */}
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

              {/* Parola */}
              <div>
                <label className="block font-bold text-slate-900">Parolă</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="minim 6 caractere"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoComplete="new-password"
                />
              </div>

              {/* Confirmă parola */}
              <div>
                <label className="block font-bold text-slate-900">Confirmă parola</label>
                <input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="repetă parola"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoComplete="new-password"
                />
              </div>

              {err && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
                  {err}
                </div>
              )}

              <button
                onClick={register}
                disabled={loading}
                className="w-full rounded-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 px-8 py-4 text-lg font-extrabold text-white shadow-lg"
              >
                {loading ? "Se creează contul..." : "Înregistrare"}
              </button>

              <p className="text-center text-sm text-slate-700">
                Ai deja cont?{" "}
                <Link
                  className="text-orange-700 font-bold underline"
                  href={`/conectare?next=${encodeURIComponent(next)}`}
                >
                  Conectare
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}