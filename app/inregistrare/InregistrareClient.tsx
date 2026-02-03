"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function normalizePhone(raw: string) {
  let cleaned = raw.trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("07")) cleaned = "+4" + cleaned;
  if (cleaned.startsWith("0040")) cleaned = "+40" + cleaned.slice(4);
  if (cleaned.startsWith("40") && !cleaned.startsWith("+")) cleaned = "+" + cleaned;

  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return cleaned;
}

type Role = "client" | "courier";

export default function InregistrareClient({ next }: { next: string }) {
  const router = useRouter();

  const [role, setRole] = useState<Role>("client");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // dacă e deja logat, îl trimitem direct la next
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

  async function signup() {
    setErr(null);
    setDone(null);

    const n = fullName.trim();
    const p = normalizePhone(phone);
    const e = email.trim();
    const pass = password.trim();

    if (!n || !p || !e || !pass) {
      setErr("Completează toate câmpurile. Telefon acceptat: 07 / +40 / 0040.");
      return;
    }
    if (pass.length < 6) {
      setErr("Parola trebuie să aibă minim 6 caractere.");
      return;
    }
    if (role === "courier" && !vehiclePlate.trim()) {
      setErr("Pentru livrator, numărul de înmatriculare este obligatoriu.");
      return;
    }

    setLoading(true);
    try {
      // 1) Creează cont (email + password)
      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email: e,
        password: pass,
      });
      if (signErr) throw new Error(signErr.message);

      const userId = signData.user?.id;
      if (!userId) {
        setDone("Cont creat. Te rog conectează-te.");
        router.push(`/conectare?next=${encodeURIComponent(next)}`);
        return;
      }

      // 2) Profile
      const { error: profErr } = await supabase.from("profiles").upsert({
        id: userId,
        role,
        full_name: n,
        phone: p,
      });
      if (profErr) throw new Error(profErr.message);

      // 3) Couriers
      if (role === "courier") {
        const { error: courErr } = await supabase.from("couriers").upsert({
          user_id: userId,
          vehicle_plate: vehiclePlate.trim().toUpperCase(),
        });
        if (courErr) throw new Error(courErr.message);
      }

      setDone("Cont creat ✅");
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
          <h1 className="text-3xl font-extrabold text-slate-900">Înregistrare</h1>
          <p className="mt-2 text-slate-600 text-sm">
            Creezi cont cu email + parolă. Rămâi logat.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block font-bold text-slate-900">Rol</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`rounded-2xl px-4 py-3 font-extrabold border ${
                role === "client"
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
              }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => setRole("courier")}
              className={`rounded-2xl px-4 py-3 font-extrabold border ${
                role === "courier"
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
              }`}
            >
              Livrator
            </button>
          </div>

          <div>
            <label className="block font-bold text-slate-900">Nume</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ex: Laurențiu"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-900">Telefon</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="ex: 07xxxxxxxx / +40xxxxxxxxx / 0040xxxxxxxxx"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {role === "courier" && (
            <div>
              <label className="block font-bold text-slate-900">
                Nr. înmatriculare (obligatoriu)
              </label>
              <input
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="ex: MH 12 ABC"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

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
              placeholder="minim 6 caractere"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoComplete="new-password"
            />
          </div>

          {err && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
              {err}
            </div>
          )}
          {done && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-800 font-semibold">
              {done}
            </div>
          )}

          <button
            onClick={signup}
            disabled={loading}
            className="w-full rounded-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 px-8 py-4 text-lg font-extrabold text-white shadow-lg"
          >
            {loading ? "Se creează..." : "Creează cont"}
          </button>

          <p className="text-center text-sm text-slate-600">
            Ai cont deja?{" "}
            <Link
              className="text-orange-700 font-bold underline"
              href={`/conectare?next=${encodeURIComponent(next)}`}
            >
              Conectare
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}