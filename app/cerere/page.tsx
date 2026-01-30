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
  const [address, setAddress] = useState(""); // UI: Adresă
  const [phone, setPhone] = useState("");
  const [urgent, setUrgent] = useState(false);

  const [busy, setBusy] = useState(false);

  async function submit() {
    const w = what.trim();
    const n = name.trim();
    const a = address.trim();
    const p = normalizePhone(phone);

    // toate obligatorii
    if (!w || !n || !a || !p) {
      alert("Completează toate câmpurile.");
      return;
    }

    // minim 10 cifre (RO)
    const digits = p.replace(/[^\d]/g, "");
    if (digits.length < 10) {
      alert("Număr de telefon invalid. Folosește format RO: 07... / +40... / 0040...");
      return;
    }

    setBusy(true);

    try {
      // who_where rămâne compatibil cu ce ai acum: "Nume, Adresă"
      const who_where = `${n}, ${a}`;

      const { error } = await supabase.from("orders").insert([
        {
          what: w,
          who_where,
          phone: p,
          urgent,
          status: "active",
        },
      ]);

      if (error) {
        alert("Eroare la trimitere: " + error.message);
        setBusy(false);
        return;
      }

      alert("Comanda a fost trimisă cu succes!");
      // reset
      setWhat("");
      setName("");
      setAddress("");
      setPhone("");
      setUrgent(false);
    } catch (e: any) {
      alert("Eroare: " + (e?.message || "necunoscută"));
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border px-5 py-4 text-lg text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-200 bg-white";

  return (
    <main className="min-h-screen bg-orange-50 p-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* HEADER */}
        <header className="text-center space-y-3">
          <Link href="/" className="inline-block text-orange-700 underline font-semibold">
            ← Înapoi
          </Link>

          <h1 className={`${brandFont.className} text-5xl font-bold text-orange-600`}>
            Amvenit.ro
          </h1>

          <p className="text-gray-700">Plasează o comandă în câteva secunde.</p>
        </header>

        {/* FORM */}
        <section className="bg-white rounded-2xl p-6 shadow space-y-6">
          <div className="space-y-2">
            <div className="text-xl font-bold text-gray-900">Ce ai nevoie?</div>
            <input
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              className={inputClass}
              placeholder="ex: pâine, transport persoane, colet, medicamente etc."
            />
          </div>

          <div className="space-y-2">
            <div className="text-xl font-bold text-gray-900">Nume</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="ex: Laurențiu"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xl font-bold text-gray-900">Adresă</div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
              placeholder="ex: Str. Principală nr. 12, Baia de Aramă"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xl font-bold text-gray-900">Telefon</div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="ex: 07xxxxxxxx / +40xxxxxxxxx"
              inputMode="tel"
            />
          </div>

          {/* URGENT */}
          <label className="block rounded-2xl border-2 border-orange-200 bg-orange-50 p-5 cursor-pointer">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="mt-1 h-6 w-6"
              />
              <div>
                <div className="text-xl font-bold text-orange-700">Urgent!</div>
                <div className="mt-1 text-gray-800">
                  <span className="text-4xl font-black text-orange-600">+10 LEI</span>{" "}
                  la finalul cursei dacă vine în <span className="font-bold">30 minute maxim</span>.
                </div>
              </div>
            </div>
          </label>

          {/* SUBMIT */}
          <button
            onClick={submit}
            disabled={busy}
            className={`w-full rounded-full bg-orange-600 hover:bg-orange-700 px-8 py-5 text-xl font-extrabold text-white shadow ${
              busy ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {busy ? "Se trimite..." : "Trimite comanda"}
          </button>
        </section>
      </div>
    </main>
  );
}