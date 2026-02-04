"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type OrderRow = {
  id: string;
  what: string;
  who_where: string;
  phone: string;
  urgent: boolean;
  status: string;
  created_at: string;

  client_id?: string | null;
  accepted_by_id?: string | null;

  cancelled_at?: string | null;
  cancel_reason?: string | null;
  cancel_note?: string | null;
};

function statusLabel(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "active") return "Comandă activă";
  if (s === "accepted") return "Comandă acceptată";
  if (s === "completed") return "Comandă finalizată";
  if (s === "cancelled") return "Comandă anulată";
  return status || "-";
}

export default function ComenzileMelePage() {
  const router = useRouter();
  const { authLoading, userId, role } = useAuth();

  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // popup anulare
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [note, setNote] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  const isCourier = role === "courier";

  useEffect(() => {
    if (!authLoading && !userId) {
      router.replace("/conectare?next=/comenzile-mele");
    }
  }, [authLoading, userId, router]);

  async function loadOrders() {
    if (!userId) return;
    setLoading(true);
    setErr(null);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, what, who_where, phone, urgent, status, created_at, client_id, accepted_by_id, cancelled_at, cancel_reason, cancel_note"
        )
        .or(`client_id.eq.${userId},accepted_by_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      setRows((data as OrderRow[]) || []);
    } catch (e: any) {
      setErr(e?.message ?? "Eroare la încărcare comenzi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    loadOrders();
  }, [userId, role]);

  function startCancel(order: OrderRow) {
    setSelectedOrder(order);
    setNote("");
    setConfirmOpen(true);
    setErr(null);
  }

  async function doCancel() {
  if (!userId || !selectedOrder) return;

  const isClient = selectedOrder.client_id === userId;
  const isCourierOwner = selectedOrder.accepted_by_id === userId;

  // siguranță
  if (!isClient && !isCourierOwner) {
    setErr("Nu ai dreptul să anulezi această comandă.");
    setConfirmOpen(false);
    return;
  }

  if (isCourierOwner && note.trim().length < 3) {
    setErr("Te rog scrie motivul anulării (minim 3 caractere).");
    return;
  }

  setCancelBusy(true);
  setErr(null);

  try {
    let query = supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: isCourierOwner
          ? "Anulare livrator"
          : "Anulare client",
        cancel_note: isCourierOwner ? note.trim() : null,
      })
      .eq("id", selectedOrder.id);

    // 🔐 IMPORTANT – filtre care TREBUIE să existe pt RLS
    if (isCourierOwner) {
      query = query
        .eq("accepted_by_id", userId)
        .eq("status", "accepted");
    } else {
      query = query
        .eq("client_id", userId)
        .eq("status", "active");
    }

    const { error } = await query;
    if (error) throw new Error(error.message);

    setConfirmOpen(false);
    setSelectedOrder(null);
    setNote("");
    setCancelBusy(false);

    await loadOrders();
  } catch (e: any) {
    setErr(e?.message ?? "Nu s-a putut anula comanda.");
    setCancelBusy(false);
  }
}

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="font-semibold text-slate-700">Se încarcă…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 bg-slate-50">
      {/* POPUP ANULARE */}
      {confirmOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-7">
            <div className="text-2xl font-extrabold text-slate-900">
              Ești sigur că anulezi comanda?
            </div>

            {selectedOrder.accepted_by_id === userId && (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Scrie motivul anulării…"
                className="mt-4 w-full rounded-2xl border px-4 py-3"
                rows={3}
              />
            )}

            {err && (
              <div className="mt-3 text-red-600 font-semibold">{err}</div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={doCancel}
                disabled={cancelBusy}
                className="flex-1 rounded-full bg-red-600 px-6 py-3 font-extrabold text-white hover:bg-red-700"
              >
                {cancelBusy ? "Se anulează..." : "Da, anulează"}
              </button>

              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-full border px-6 py-3 font-extrabold"
              >
                Nu
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold">Comenzile mele</h1>
          <Link
            href="/"
            className="rounded-full bg-white border px-5 py-2 font-bold"
          >
            Acasă
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center">
            Nu ai comenzi.
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => {
              const isClientOwner = r.client_id === userId;
              const isCourierOwner = r.accepted_by_id === userId;
              const s = (r.status || "").toLowerCase();

// client: doar când e active
const clientCanCancel = isClientOwner && s === "active";

// livrator: doar când e accepted (adică a acceptat-o și încă e “în curs”)
const courierCanCancel = isCourierOwner && s === "accepted";

const canCancel = clientCanCancel || courierCanCancel;

              return (
                <div key={r.id} className="bg-white p-6 rounded-3xl shadow">
                  <div className="font-extrabold text-xl">{r.what}</div>
                  <div className="text-slate-600">{r.who_where}</div>

                  <div className="mt-3 flex justify-between items-center">
                    <span className="font-semibold">
                      Status: {statusLabel(r.status)}
                    </span>

                    {canCancel && (
                      <button
                        onClick={() => startCancel(r)}
                        className="rounded-full bg-red-50 border border-red-300 px-4 py-2 text-red-700 font-extrabold hover:bg-red-100"
                      >
                        Anulează
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}