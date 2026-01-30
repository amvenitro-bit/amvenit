"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Poppins } from "next/font/google";

const brandFont = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
});

function normalizePhone(raw: string) {
  let cleaned = raw.trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("07")) cleaned = "+4" + cleaned; // +407...
  if (cleaned.startsWith("0040")) cleaned = "+40" + cleaned.slice(4);
  if (cleaned.startsWith("40") && !cleaned.startsWith("+")) cleaned = "+" + cleaned;
  return cleaned;
}

function isValidRoPhone(raw: string) {
  const p = normalizePhone(raw);
  // Acceptăm: +407xxxxxxxx, 07xxxxxxxx, 00407xxxxxxxx, +40...
  // minim 10 cifre
  const digits = p.replace(/\D/g, "");
  return digits.length >= 10;
}

export default function CererePage() {
  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [what, setWhat] = useState("");
  const [name, setName] = useState("");
  const [locality, setLocality] = useState("");
  const [phone, setPhone] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;

    const w = what.trim();
    const n = name.trim();
    const l = locality.trim();
    const pRaw = phone.trim();

    if (!w || !n || !l || !pRaw) {
      alert("Completează toate câmpurile.");
      return;
    }

    if (!isValidRoPhone(pRaw)) {
      alert("Telefon invalid. Exemplu: 07xxxxxxxx sau +407xxxxxxxx");
      return;
    }

    const p = normalizePhone(pRaw);
    const who_where = `${n}, ${l}`;

    setBusy(true);
    try {
      // Status inițial: "active" (sau NULL dacă vrei)
      const { error } = await supabase.from("orders").insert([
        {
          what: w,
          who_where,
          phone: p,
          urgent,
          status: "active",
        },
      ]);

      if (error) throw new Error(error.message);

      alert("Comanda a fost trimisă cu succes!");
      setWhat("");
      setName("");
      setLocality("");
      setPhone("");
      setUrgent(false);
    } catch (e: any) {
      alert(e?.message || "Eroare la trimitere. Verifică și încearcă din nou.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-orange-50 p-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <Link href="/" className="text-orange-700 underline">
            ← Înapoi
          </Link>
        </div>

        <header className="text-center space-y-3">
          <h1 className={`${brandFont.className} text-5xl font-bold text-orange-600`}>
            Amvenit.ro
          </h1>
          <p className="text-gray-700">Plasează o comandă în câteva secunde.</p>
        </header>

        <section className="bg-white rounded-2xl p-6 shadow space-y-5">
          <div>
            <label className="block font-bold mb-2">Ce ai nevoie?</label>
            <input
              className="w-full rounded-2xl border px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="ex: paine, transport persoane, colet, medicamente etc."
              value={what}
              onChange={(e) => setWhat(e.target.value)}
            />
          </div>

          {/* Nume (obligatoriu) */}
          <div>
            <label className="block font-bold mb-2">Nume</label>
            <input
              className="w-full rounded-2xl border px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="ex: Laurențiu"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Localitate (obligatoriu) */}
          <div>
            <label className="block font-bold mb-2">Localitate</label>
            <input
              className="w-full rounded-2xl border px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="ex: Baia de Aramă"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-bold mb-2">Telefon</label>
            <input
              className="w-full rounded-2xl border px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="ex: 07xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
            />
          </div>

          <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-5 flex items-start gap-4">
            <input
              type="checkbox"
              className="mt-2 h-6 w-6"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
            />
            <div>
              <div className="font-bold text-orange-700">Urgent!</div>
              <div className="text-2xl font-black text-orange-600">
                +10 LEI{" "}
                <span className="text-base font-semibold text-gray-800">
                  la finalul cursei dacă vine în <b>30 minute maxim</b>.
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-full bg-orange-600 hover:bg-orange-700 px-8 py-5 text-xl font-extrabold text-white shadow disabled:opacity-60"
          >
            {busy ? "Se trimite..." : "Trimite comanda"}
          </button>
        </section>
      </div>
    </main>
  );
}