"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  created_at: string;
  what: string | null;
  who_where: string | null;
  phone: string | null;
  urgent: boolean | null;
  verify_code: string | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ro-RO");
}

export default function AdminCereri() {
  const [key, setKey] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(k: string) {
    setErr(null);
    const res = await fetch(`/api/admin/orders?key=${encodeURIComponent(k)}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErr(data?.error || "Eroare.");
      setOrders([]);
      return;
    }
    setOrders((data?.orders || []) as Order[]);
  }

  useEffect(() => {
    const url = new URL(window.location.href);
    const k = url.searchParams.get("key") || "";
    if (k) {
      setKey(k);
      load(k);
    }
  }, []);

  async function verify(id: string) {
    setBusyId(id);
    const res = await fetch("/api/admin/orders/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, id }),
    });
    const data = await res.json().catch(() => null);
    setBusyId(null);
    if (!res.ok) {
      alert(data?.error || "Eroare la confirmare.");
      return;
    }
    await load(key);
  }

  async function reject(id: string) {
    if (!confirm("Sigur respingi (ștergi) cererea?")) return;
    setBusyId(id);
    const res = await fetch("/api/admin/orders/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, id }),
    });
    const data = await res.json().catch(() => null);
    setBusyId(null);
    if (!res.ok) {
      alert(data?.error || "Eroare la respingere.");
      return;
    }
    await load(key);
  }

  return (
    <main className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-black">Admin – Confirmare telefoane (cereri)</h1>
        <p className="text-sm text-gray-600">
          Aici confirmi rapid cererile după mesajul WhatsApp (cod).
        </p>

        {err && (
          <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
            {err}
          </div>
        )}

        <button
          onClick={() => load(key)}
          className="rounded-full border px-4 py-2 hover:bg-orange-50 text-sm"
        >
          Refresh
        </button>

        {orders.length === 0 ? (
          <div className="text-gray-600">Nu sunt cereri de confirmat.</div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="border rounded-2xl p-4">
                <div className="font-extrabold text-lg">{o.who_where}</div>
                <div className="text-sm text-gray-700 mt-1">{o.what}</div>

                <div className="mt-2 text-xs text-gray-500">
                  {fmt(o.created_at)}
                  {o.urgent ? " • URGENT" : ""}
                </div>

                <div className="mt-3 rounded-xl bg-orange-50 border p-3 text-sm">
                  <div><b>Telefon:</b> {o.phone}</div>
                  <div><b>Cod:</b> {o.verify_code}</div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => verify(o.id)}
                    disabled={busyId === o.id}
                    className="rounded-full bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2"
                  >
                    {busyId === o.id ? "..." : "Confirmă"}
                  </button>

                  <button
                    onClick={() => reject(o.id)}
                    disabled={busyId === o.id}
                    className="rounded-full bg-gray-200 hover:bg-gray-300 font-bold px-4 py-2"
                  >
                    Respinge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}