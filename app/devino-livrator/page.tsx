"use client";

import Link from "next/link";
import { useState } from "react";
import { Poppins } from "next/font/google";

const brandFont = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
});

function normalizeRoMobile(raw: string) {
  let d = (raw || "").trim().replace(/[^\d]/g, "");

  if (d.startsWith("0040")) d = "0" + d.slice(4);
  if (d.startsWith("40")) d = "0" + d.slice(2);

  if (!/^07\d{8}$/.test(d)) return { ok: false as const, normalized: "" };

  return { ok: true as const, normalized: "+4" + d }; // +407...
}

export default function DevinoLivratorPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const n = name.trim();
    const p = phone.trim();
    const a = area.trim();

    if (!n || !p) {
      alert("Completează numele și telefonul.");
      return;
    }

    const check = normalizeRoMobile(p);
    if (!check.ok) {
      alert("Telefon invalid. Folosește 07xxxxxxxx sau +40/0040 (ex: 073xxxxxxx).");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/courier-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, phone: p, area: a }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Eroare la trimitere. Încearcă din nou.");
        return;
      }

      alert("Cererea ta a fost trimisă. Te contactăm după aprobare.");
      setName("");
      setPhone("");
      setArea("");
    } catch (e: any) {
      alert(e?.message || "Eroare. Verifică internetul și încearcă din nou.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-orange-50 p-6 flex justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl p-6 shadow space-y-5">
        <div className="text-center space-y-2">
          <Link href="/" className="text-sm text-orange-700 underline">
            ← Înapoi
          </Link>

          <h1 className={`${brandFont.className} text-4xl font-bold text-orange-600`}>
            Amvenit.ro
          </h1>
          <p className="text-gray-700">
            Completează datele și trimite cererea. După aprobare îți trimitem un PIN.
          </p>
        </div>

        <div>
          <label className="font-semibold">Nume</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3"
            placeholder="Ex: Laurențiu"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="font-semibold">Telefon</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3"
            placeholder="Ex: 073xxxxxxx / +4073xxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">
            Acceptăm doar numere RO: 07 / +40 / 0040.
          </p>
        </div>

        <div>
          <label className="font-semibold">Zonă (opțional)</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3"
            placeholder="Ex: Baia de Aramă"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="w-full rounded-full bg-orange-600 hover:bg-orange-700 px-8 py-4 text-lg font-semibold text-white shadow disabled:opacity-60"
        >
          {busy ? "Se trimite..." : "Trimite cererea"}
        </button>
      </div>
    </main>
  );
}