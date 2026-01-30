"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CourierRequest = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  area: string | null;
  status: "pending" | "approved" | "rejected";
};

function genPin() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 cifre
}

function normalizePhone(phone: string) {
  // foarte simplu: scoate spatii/-.() ; lasă + și cifre
  return phone.replace(/[^\d+]/g, "");
}

export default function AdminLivratoriPage() {
  const params = useSearchParams();
  const key = params.get("key") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<CourierRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const allowed = useMemo(() => {
    return key && key === process.env.NEXT_PUBLIC_ADMIN_KEY;
  }, [key]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("courier_requests")
        .select("id, created_at, name, phone, area, status")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      setItems((data || []) as CourierRequest[]);
    } catch (e: any) {
      setError(e?.message || "Eroare la încărcare.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!allowed) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  async function approve(req: CourierRequest) {
    setBusyId(req.id);
    setError("");
    try {
      const pin = genPin();

      // 1) setează status=approved
      const { error: e1 } = await supabase
        .from("courier_requests")
        .update({ status: "approved" })
        .eq("id", req.id);

      if (e1) throw new Error(e1.message);

      // 2) creează livrator în tabela couriers
      const { error: e2 } = await supabase.from("couriers").insert([
        {
          name: req.name,
          phone: req.phone,
          pin,
          active: true,
        },
      ]);

      if (e2) throw new Error(e2.message);

      // 3) deschide WhatsApp cu mesajul + PIN (admin trimite manual)
      const p = normalizePhone(req.phone);
      const msg = encodeURIComponent(
        `Salut, ${req.name}! Contul tău de livrator pe Amvenit.ro a fost aprobat.\nPIN-ul tău este: ${pin}\n\nPăstrează PIN-ul. Îl vei folosi când accepți comenzi.`
      );

      // Dacă numărul e RO fără +4..., WhatsApp merge și cu 07..., dar preferăm +40 când e posibil
      const wa = `https://wa.me/${p.startsWith("0") ? "4" + p : p}?text=${msg}`;

      window.open(wa, "_blank");

      await load();
    } catch (e: any) {
      setError(e?.message || "Eroare la aprobare.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(req: CourierRequest) {
    setBusyId(req.id);
    setError("");
    try {
      const { error } = await supabase
        .from("courier_requests")
        .update({ status: "rejected" })
        .eq("id", req.id);

      if (error) throw new Error(error.message);
      await load();
    } catch (e: any) {
      setError(e?.message || "Eroare la respingere.");
    } finally {
      setBusyId(null);
    }
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-orange-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
          <h1 className="text-xl font-bold">Admin – Livratori</h1>
          <p className="mt-2 text-sm text-gray-700">
            Acces interzis. Link-ul trebuie să conțină cheia corectă.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Admin – Cereri livrator</h1>
          <button
            onClick={load}
            className="rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <p className="text-gray-600">Se încarcă...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-600">Nu există cereri.</p>
          ) : (
            <div className="space-y-3">
              {items.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-lg">{r.name}</div>
                      <div className="text-sm text-gray-700">
                        {r.phone} {r.area ? `• ${r.area}` : ""}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(r.created_at).toLocaleString("ro-RO")}
                      </div>
                    </div>

                    <span
                      className={[
                        "text-xs font-bold px-3 py-1 rounded-full",
                        r.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : r.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700",
                      ].join(" ")}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      disabled={r.status !== "pending" || busyId === r.id}
                      onClick={() => approve(r)}
                      className="rounded-full bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2 disabled:opacity-50"
                    >
                      {busyId === r.id ? "..." : "Aprobă + trimite PIN (WhatsApp)"}
                    </button>

                    <button
                      disabled={r.status !== "pending" || busyId === r.id}
                      onClick={() => reject(r)}
                      className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold px-5 py-2 disabled:opacity-50"
                    >
                      Respinge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Notă: PIN-ul se trimite manual pe WhatsApp (zero cost SMS). Cererea rămâne în istoric.
        </p>
      </div>
    </main>
  );
}