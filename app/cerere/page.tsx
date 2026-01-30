"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function normalizeRoMobile(raw: string) {
  let d = (raw || "").trim().replace(/[^\d]/g, "");
  if (d.startsWith("0040")) d = "0" + d.slice(4);
  if (d.startsWith("40")) d = "0" + d.slice(2);
  if (!/^07\d{8}$/.test(d)) return { ok: false as const, normalized: "" };
  return { ok: true as const, normalized: "+4" + d }; // +407...
}

function genCode6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function waAdminLink(adminPhone: string, text: string) {
  const digits = adminPhone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default function CererePage() {
  const router = useRouter();

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const ADMIN_WA = process.env.NEXT_PUBLIC_ADMIN_WA || "";

  const [what, setWhat] = useState("");
  const [name, setName] = useState("");
  const [locality, setLocality] = useState("");
  const [phone, setPhone] = useState("");
  const [urgent, setUrgent] = useState(false);

  const [verifyCode, setVerifyCode] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const w = what.trim();
    const n = name.trim();
    const loc = locality.trim();
    const pRaw = phone.trim();

    // obligatorii
    if (!w || !n || !loc || !pRaw) {
      alert("Completează toate câmpurile.");
      return;
    }

    // validare telefon RO mobil
    const check = normalizeRoMobile(pRaw);
    if (!check.ok) {
      alert("Telefon invalid. Folosește 07xxxxxxxx sau +40/0040.");
      return;
    }

    // cod de verificare
    const code = verifyCode || genCode6();
    if (!verifyCode) setVerifyCode(code);

    setLoading(true);

    // ✅ 1) Inserăm comanda IMEDIAT (active), dar cu phone_verified=false
    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          what: w,
          who_where: `${n}, ${loc}`,
          phone: check.normalized, // se salvează, dar NU se afișează până nu confirmi tu
          urgent,
          status: "active",
          phone_verified: false,
          verify_code: code,
        },
      ])
      .select("id")
      .single();

    if (error || !data?.id) {
      setLoading(false);
      alert("Eroare la trimitere. Încearcă din nou.");
      return;
    }

    const orderId = data.id as string;

    // ✅ 2) Trimitem email către admin (Resend) cu butoane Confirmă/Respinge
    // (nu blocăm userul dacă email-ul pică)
    fetch("/api/order-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch(() => {});

    setLoading(false);

    // ✅ 3) Deschidem WhatsApp către tine (opțional)
    if (ADMIN_WA) {
      const msg =
        `Confirm comanda pe Amvenit.ro\n` +
        `COD: ${code}\n` +
        `Nume: ${n}\n` +
        `Localitate: ${loc}\n` +
        `Telefon: ${check.normalized}\n` +
        `Cerere: ${w}\n` +
        (urgent ? `URGENT: DA (+10 lei)\n` : `URGENT: NU\n`) +
        `ID: ${orderId}\n`;

      window.open(waAdminLink(ADMIN_WA, msg), "_blank");
    }

    alert("Comanda a fost publicată. Telefonul rămâne ascuns până confirmă adminul.");
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-orange-50 p-6 flex justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl p-6 shadow space-y-5">
        <button onClick={() => router.back()} className="text-sm text-orange-700 underline">
          ← Înapoi
        </button>

        <h1 className="text-3xl font-extrabold text-center text-orange-600">Amvenit.ro</h1>
        <p className="text-center text-gray-600">Plasează o comandă în câteva secunde.</p>

        <div>
          <label className="font-semibold">Ce ai nevoie?</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3"
            placeholder="ex: pâine, transport persoane, colet, medicamente etc."
            value={what}
            onChange={(e) => setWhat(e.target.value)}
          />
        </div>

        <div>
          <label className="font-semibold">Nume</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3"
            placeholder="ex: Laurențiu"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="font-semibold">Localitate</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3"
            placeholder="ex: Baia de Aramă"
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
          />
        </div>

        <div>
          <label className="font-semibold">Telefon</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3"
            placeholder="ex: 073xxxxxxx / +4073xxxxxxx / 004073xxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">
            Numărul nu va fi vizibil public până îl confirmă adminul.
          </p>
        </div>

        <label className="flex items-center gap-3 border-2 border-orange-300 rounded-xl p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            className="w-5 h-5"
          />
          <div>
            <div className="font-bold text-orange-700">Urgent!</div>
            <div className="text-sm">
              <span className="text-xl font-extrabold text-orange-600">+10 LEI</span>{" "}
              la finalul cursei dacă vine în <b>30 minute maxim</b>.
            </div>
          </div>
        </label>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full rounded-full bg-orange-600 hover:bg-orange-700 py-4 text-white text-lg font-extrabold disabled:opacity-60"
        >
          {loading ? "Se trimite..." : "Trimite comanda"}
        </button>

        <p className="text-xs text-gray-500 text-center pt-2">
          * După confirmare, livratorii cu PIN vor putea folosi Chat/Sună.
        </p>
      </div>
    </main>
  );
}