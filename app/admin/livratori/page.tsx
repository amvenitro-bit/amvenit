"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type CourierRequest = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  area: string | null;
  status: string; // pending / approved / rejected
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

export default function AdminLivratoriPage() {
  const sp = useSearchParams();
  const key = useMemo(() => sp.get("key") || "", [sp]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<CourierRequest[]>([]);
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
      const r = await fetch(`/api/admin/couriers?key=${encodeURIComponent(key)}`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Eroare la încărcare.");
      setItems(j.requests || []);
    } catch (e: any) {
      setErr(e?.message || "Eroare necunoscută.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function approve(id: string) {
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/couriers/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ key, id }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Eroare la aprobare.");
      alert(`Aprobat ✅ PIN: ${j.pin}`);
      await load();
    } catch (e: any) {
      alert(e?.message || "Eroare.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!confirm("Sigur respingi cererea de livrator?")) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/couriers/reject`, {
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

  const pending = items.filter((x) => x.status === "pending");
  const approved = items.filter((x) => x.status === "approved");

  return (
    <main className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-extrabold">Admin • Livratori</h1>
            <Link className="text-sm underline text-orange-700" href="/">
              Înapoi
            </Link>
          </div>

          <p className="text-sm text-gray-600 mt-2">
            Aici aprobi cererile de livrator. La aprobare, sistemul generează un PIN (nu expiră) și îl leagă de telefon.
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
          <h2 className="font-extrabold">Cereri în așteptare</h2>

          {loading ? (
            <div className="text-gray-600 mt-3">Se încarcă...</div>
          ) : pending.length === 0 ? (
            <div className="text-gray-600 mt-3">Nicio cerere pending.</div>
          ) : (
            <div className="mt-3 space-y-3">
              {pending.map((c) => (
                <div key={c.id} className="border rounded-2xl p-4">
                  <div className="font-bold">{c.name}</div>
                  <div className="text-sm text-gray-700">{c.phone}</div>
                  <div className="text-xs text-gray-500">
                    Zonă: {c.area || "-"} • {fmt(c.created_at)}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={busyId === c.id}
                      onClick={() => approve(c.id)}
                      className="rounded-full bg-green-600 hover:bg-green-700 text-white font-extrabold px-5 py-2"
                    >
                      {busyId === c.id ? "..." : "Aprobă + PIN"}
                    </button>

                    <button
                      disabled={busyId === c.id}
                      onClick={() => reject(c.id)}
                      className="rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold px-5 py-2"
                    >
                      Respinge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-extrabold">Aprobați</h2>
          {loading ? (
            <div className="text-gray-600 mt-3">Se încarcă...</div>
          ) : approved.length === 0 ? (
            <div className="text-gray-600 mt-3">Niciun livrator aprobat încă.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {approved.map((c) => (
                <div key={c.id} className="bg-gray-100 text-gray-700 rounded-xl px-4 py-3">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs">{c.phone} • {fmt(c.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}