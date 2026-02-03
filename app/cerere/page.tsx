"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

function normalizePhone(raw: string) {
  let cleaned = raw.trim().replace(/[^\d+]/g, "");

  // accept RO formats: 07..., +40..., 0040...
  if (cleaned.startsWith("07")) cleaned = "+4" + cleaned; // 07xxxxxxxx -> +407xxxxxxxx
  if (cleaned.startsWith("0040")) cleaned = "+40" + cleaned.slice(4);
  if (cleaned.startsWith("40") && !cleaned.startsWith("+")) cleaned = "+" + cleaned;

  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return cleaned;
}

export default function CererePage() {
  const [what, setWhat] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [urgent, setUrgent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setDone(null);

    const w = what.trim();
    const n = name.trim();
    const a = address.trim();
    const p = phone.trim();

    if (!w || !n || !a || !p) {
      setErr("Completează toate câmpurile (toate sunt obligatorii).");
      return;
    }

    setLoading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        throw new Error("Trebuie să fii logat ca să trimiți o cerere.");
      }

      const normalized = normalizePhone(p);
      if (!normalized) {
        throw new Error(
          "Număr de telefon invalid. Accept: 07 / +40 / 0040 (minim 10 cifre)."
        );
      }

      const who_where = `${n} • ${a}`;
      const { error } = await supabase.from("orders").insert([
        {
          client_id: userData.user.id,
          what: w,
          who_where,
          phone: normalized,
          urgent,
          status: "active",
        },
      ]);

      if (error) throw new Error(error.message);

      setDone("Comanda a fost trimisă.");
      setWhat("");
      setName("");
      setAddress("");
      setPhone("");
      setUrgent(false);
    } catch (e: any) {
      setErr(e?.message ?? "Eroare necunoscută.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center px-5 py-16">
      {/* BACKGROUND ca pe home */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-hero-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-block text-sm font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-4"
          >
            ← Înapoi
          </Link>

          <h1 className="mt-5 text-5xl font-extrabold text-slate-900">
            amvenit.ro
          </h1>
          <p className="mt-3 text-base md:text-lg text-slate-600">
            Plasează o comandă în câteva secunde.
          </p>
        </div>

        <section className="bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-black/5 p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <label className="block font-bold text-slate-900 text-lg">
                Ce ai nevoie?
              </label>
              <input
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                placeholder="ex: pâine, transport persoane, colet, medicamente etc."
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 text-lg">
                Nume
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Laurențiu"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 text-lg">
                Adresă
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex: Str. Principală nr. 12, Baia de Aramă"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 text-lg">
                Telefon
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: 07xxxxxxxx / +40xxxxxxxxx / 0040xxxxxxxxx"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <label className="block rounded-2xl border border-orange-200 bg-orange-50/60 p-5 cursor-pointer">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <div>
                  <div className="font-extrabold text-orange-700 text-lg">
                    Urgent!
                  </div>
                  <div className="mt-2 text-slate-800">
                    <span className="text-4xl font-black text-orange-600">
                      +10 LEI
                    </span>{" "}
                    <span className="font-semibold">
                      la finalul cursei dacă vine în <b>30 minute maxim</b>.
                    </span>
                  </div>
                </div>
              </div>
            </label>

            {err && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
                <p>{err}</p>

                {err.includes("Trebuie să fii logat") && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/conectare?next=/cerere"
                      className="flex-1 text-center rounded-full border border-orange-600 bg-white px-6 py-3 font-extrabold text-orange-600 hover:bg-orange-50"
                    >
                      Conectare
                    </Link>
                    <Link
                      href="/inregistrare?next=/cerere"
                      className="flex-1 text-center rounded-full bg-orange-600 px-6 py-3 font-extrabold text-white hover:bg-orange-700"
                    >
                      Înregistrare
                    </Link>
                  </div>
                )}
              </div>
            )}

            {done && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-800 font-semibold">
                {done}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full rounded-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 px-8 py-5 text-lg font-extrabold text-white shadow-lg"
            >
              {loading ? "Se trimite..." : "Trimite comanda"}
            </button>

            <p className="text-center text-xs text-slate-500 pt-2">
              * Platformă de intermediere. Livratorii sunt responsabili de
              livrare.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}