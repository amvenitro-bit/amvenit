"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Order = {
  id: string;
  created_at: string;
  name: string | null;
  locality: string | null;
  phone: string | null;
  what: string | null;
  urgent: boolean | null;
  status: string | null; // pending / verified / rejected / accepted / completed etc.
};

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("ro-RO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminCereriPage() {
  const sp = useSearchParams();
  const key = useMemo(() => sp.get("key") || "", [sp]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Order[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    if (!key) {
      setErr("Lipsește cheia admin (query param ?key=...).");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/orders?key=${encodeURIComponent(key)}`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Eroare la încărcare.");
      setItems(j.orders || []);
    } catch (e: any) {
      setErr(e?.message || "Eroare necunoscută.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // refresh periodic
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function verify(id: string) {
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/orders/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ key, id }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Eroare la verificare.");
      await load();
    } catch (e: any) {
      alert(e?.message || "Eroare.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!confirm("Sigur respingi cererea?")) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/orders/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ key, id }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Eroare la respingere.");
      await load();
    } catch (e: any) {
      alert(e?.message || "Eroare.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-extrabold">Admin • Cereri</h1>
            <Link className="text-sm underline text-orange-700" href={`/?key=${encodeURIComponent(key)}`}>
              Înapoi
            </Link>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Aici verifici cererile venite pe WhatsApp (status: <b>pending</b>) și le publici (status: <b>verified</b>).
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={load}
              className="rounded-full border px-4 py-2 hover:bg-orange-100 text-sm"
            >
              Refresh
            </button>
          </div>

          {err && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
              {err}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          {loading ? (
            <div className="text-gray-600">Se încarcă...</div>
          ) : items.length === 0 ? (
            <div className="text-gray-600">Nu există cereri.</div>
          ) : (
            <div className="space-y-3">
              {items.map((o) => (
                <div key={o.id} className="border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">
                        {(o.name || "-") + (o.locality ? `, ${o.locality}` : "")}
                        {o.urgent ? (
                          <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-red-800 font-extrabold text-xs">
                            URGENT <span className="ml-2 text-base font-black">+10 lei</span>
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-500">{fmt(o.created_at)}</div>
                      <div className="mt-2 text-sm text-gray-900">{o.what || "-"}</div>
                      <div className="mt-2 text-xs text-gray-500">
                        Telefon: {o.phone || "-"} • Status: <b>{o.status || "pending"}</b>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <button
                        disabled={busyId === o.id}
                        onClick={() => verify(o.id)}
                        className="rounded-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-2"
                      >
                        {busyId === o.id ? "..." : "Verifică"}
                      </button>
                      <button
                        disabled={busyId === o.id}
                        onClick={() => reject(o.id)}
                        className="rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2"
                      >
                        Respinge
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}