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
  if (cleaned.startsWith("07")) cleaned = "+4" + cleaned;
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
  const [whoWhere, setWhoWhere] = useState("");
  const [phone, setPhone] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const w = what.trim();
    const ww = whoWhere.trim();
    const p = phone.trim();

    if (!w || !ww || !p) {
      alert("Completează toate câmpurile.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.from("orders").insert([
        {
          what: w,
          who_where: ww,
          phone: normalizePhone(p),
          urgent,
          status: "active",
        },
      ]);

      if (error) throw new Error(error.message);

      alert("Comanda a fost trimisă cu succes!");
      setWhat("");
      setWhoWhere("");
      setPhone("");
      setUrgent(false);
    } catch (e: any) {
      alert(e?.message || "Eroare la trimitere.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-orange-50 p-6 flex justify-center text-gray-900">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <Link href="/" className="text-orange-700 underline">
            ← Înapoi
          </Link>

          <h1 className={`${brandFont.className} text-5xl font-bold text-orange-600 mt-4`}>
            Amvenit.ro
          </h1>
          <p className="text-gray-800 mt-2">Plasează o comandă în câteva secunde.</p>
        </div>

        <section className="bg-white rounded-2xl p-6 shadow text-gray-900">
          <div className="space-y-5">
            {/* Ce ai nevoie */}
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-2">
                Ce ai nevoie?
              </label>
              <input
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                placeholder="ex: pâine, transport persoane, colet, medicamente etc."
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            {/* Nume / Localitate */}
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-2">
                Nume / Localitate
              </label>
              <input
                value={whoWhere}
                onChange={(e) => setWhoWhere(e.target.value)}
                placeholder="ex: Laurențiu, Pistrița"
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-2">
                Telefon
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: 07xxxxxxxx"
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            {/* Urgent */}
            <label className="block rounded-2xl border-2 border-orange-200 bg-orange-50 p-5 cursor-pointer">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="mt-1 h-6 w-6"
                />
                <div>
                  <div className="text-lg font-extrabold text-orange-700">Urgent!</div>
                  <div className="text-gray-800 mt-1">
                    <span className="text-4xl font-black text-orange-600">+10 LEI</span>{" "}
                    la finalul cursei dacă vine în{" "}
                    <span className="font-extrabold">30 minute maxim</span>.
                  </div>
                </div>
              </div>
            </label>

            {/* Submit */}
            <button
              onClick={submit}
              disabled={busy}
              className="w-full rounded-full bg-orange-600 hover:bg-orange-700 px-8 py-5 text-xl font-extrabold text-white shadow disabled:opacity-60"
            >
              {busy ? "Se trimite..." : "Trimite comanda"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}