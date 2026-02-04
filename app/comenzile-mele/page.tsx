"use client";

import { useEffect, useMemo, useState } from "react";
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

type CancelReason = "TIMP_PREA_MARE" | "M_AM_RAZGANDIT" | "ALT_MOTIV";

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

  // Popups anulare
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);

  const [reason, setReason] = useState<CancelReason>("TIMP_PREA_MARE");
  const [otherText, setOtherText] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  const isCourier = role === "courier";

  const canCancel = useMemo(() => {
    const s = (selectedOrder?.status || "").toLowerCase();
    // anularea o permitem doar clientului și doar dacă e "active"
    return s === "active";
  }, [selectedOrder]);

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
      // IMPORTANT: Comenzile mele pentru ORICINE:
      // - client: client_id = userId
      // - courier: accepted_by_id = userId
      // (RLS trebuie să permită select pe aceste două cazuri)
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, what, who_where, phone, urgent, status, created_at, client_id, accepted_by_id, cancelled_at, cancel_reason, cancel_note"
        )
        .or(`client_id.eq.${userId},accepted_by_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      setRows(((data as OrderRow[]) || []) as OrderRow[]);
    } catch (e: any) {
      setErr(e?.message ?? "Eroare la încărcare comenzi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, role]);

  function startCancel(order: OrderRow) {
    setSelectedOrder(order);
    setReason("TIMP_PREA_MARE");
    setOtherText("");
    setConfirmOpen(true);
  }

  async function doCancel() {
    if (!userId || !selectedOrder) return;

    // anularea o permitem DOAR dacă ești clientul comenzii
    if ((selectedOrder.client_id || "") !== userId) {
      setErr("Doar clientul poate anula comanda.");
      setConfirmOpen(false);
      setReasonOpen(false);
      return;
    }

    if (!canCancel) {
      setErr("Comanda nu mai poate fi anulată (nu mai este activă).");
      setConfirmOpen(false);
      setReasonOpen(false);
      return;
    }

    if (reason === "ALT_MOTIV" && otherText.trim().length < 3) {
      setErr("Te rog scrie un motiv (minim 3 caractere).");
      return;
    }

    setCancelBusy(true);
    setErr(null);

    const cancel_reason =
      reason === "TIMP_PREA_MARE"
        ? "Timp prea mare de așteptare"
        : reason === "M_AM_RAZGANDIT"
        ? "M-am răzgândit"
        : "Alt motiv";

    const cancel_note = reason === "ALT_MOTIV" ? otherText.trim() : null;

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason,
          cancel_note,
        })
        .eq("id", selectedOrder.id)
        .eq("client_id", userId)
        .eq("status", "active");

      if (error) throw new Error(error.message);

      setConfirmOpen(false);
      setReasonOpen(false);
      setSelectedOrder(null);
      setCancelBusy(false);

      await loadOrders();
    } catch (e: any) {
      setErr(e?.message ?? "Nu s-a putut anula comanda.");
      setCancelBusy(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-slate-700 font-semibold">Se verifică sesiunea…</div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-slate-700 font-semibold">Se încarcă comenzile…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 bg-slate-50">
      {/* POPUP 1: confirmare */}
      {confirmOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-black/10 p-7">
            <div className="text-2xl font-extrabold text-slate-900">
              Ești sigur că anulezi comanda?
            </div>
            <p className="mt-3 text-slate-700">{selectedOrder.what}</p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  setReasonOpen(true);
                }}
                className="flex-1 rounded-full bg-orange-600 px-6 py-3 font-extrabold text-white hover:bg-orange-700"
              >
                Da
              </button>

              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-full border border-slate-300 bg-white px-6 py-3 font-extrabold text-slate-800 hover:bg-slate-50"
              >
                Nu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: motiv */}
      {reasonOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setReasonOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-black/10 p-7">
            <div className="text-2xl font-extrabold text-slate-900">
              Comanda ta va fi anulată.
            </div>
            <p className="mt-3 text-slate-700">Te rog spune motivul anulării:</p>

            <div className="mt-5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  checked={reason === "TIMP_PREA_MARE"}
                  onChange={() => setReason("TIMP_PREA_MARE")}
                />
                <span className="font-semibold text-slate-800">
                  Timp prea mare de așteptare
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  checked={reason === "M_AM_RAZGANDIT"}
                  onChange={() => setReason("M_AM_RAZGANDIT")}
                />
                <span className="font-semibold text-slate-800">
                  M-am răzgândit
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  checked={reason === "ALT_MOTIV"}
                  onChange={() => setReason("ALT_MOTIV")}
                />
                <span className="font-semibold text-slate-800">Alt motiv</span>
              </label>

              {reason === "ALT_MOTIV" && (
                <textarea
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Scrie motivul…"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              )}
            </div>

            {err && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
                {err}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                disabled={cancelBusy}
                onClick={doCancel}
                className="flex-1 rounded-full bg-orange-600 px-6 py-3 font-extrabold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {cancelBusy ? "Se anulează..." : "Confirmă anularea"}
              </button>

              <button
                onClick={() => setReasonOpen(false)}
                className="flex-1 rounded-full border border-slate-300 bg-white px-6 py-3 font-extrabold text-slate-800 hover:bg-slate-50"
              >
                Înapoi
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            {isCourier ? "Comenzile mele (Livrator + Client)" : "Comenzile mele"}
          </h1>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-full bg-white border border-slate-200 px-5 py-2 text-slate-800 font-bold hover:bg-slate-50"
            >
              Acasă
            </Link>
            <Link
              href="/cont"
              className="rounded-full bg-orange-600 px-5 py-2 text-white font-bold hover:bg-orange-700"
            >
              Contul meu
            </Link>
          </div>
        </div>

        {err && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
            {err}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="rounded-3xl bg-white shadow p-8 text-center text-slate-600">
            Nu ai încă nicio comandă.
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => {
              const s = (r.status || "").toLowerCase();
              const isActive = s === "active";
              const isMineAsClient = (r.client_id || "") === userId;
              const isMineAsCourier = (r.accepted_by_id || "") === userId;

              return (
                <div
                  key={r.id}
                  className="rounded-3xl bg-white shadow border border-black/5 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xl font-extrabold text-slate-900">
                        {r.what}
                      </div>
                      <div className="mt-1 text-slate-700">{r.who_where}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {new Date(r.created_at).toLocaleString("ro-RO")}
                      </div>

                      {(isCourier || isMineAsClient) && (
                        <div className="mt-2 text-sm text-slate-700">
                          Telefon:{" "}
                          <span className="font-extrabold">{r.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* badge tip */}
                      {(isMineAsClient || isMineAsCourier) && (
                        <div className="flex gap-2">
                          {isMineAsClient && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
                              CLIENT
                            </span>
                          )}
                          {isMineAsCourier && (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700">
                              LIVRATOR
                            </span>
                          )}
                        </div>
                      )}

                      {r.urgent && (
                        <div className="rounded-full bg-orange-100 px-4 py-1 text-orange-700 font-extrabold">
                          Urgent
                        </div>
                      )}

                      {/* anulare doar client + active */}
                      {isActive && isMineAsClient && (
                        <button
                          onClick={() => startCancel(r)}
                          className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-red-700 font-extrabold hover:bg-red-100"
                        >
                          Anulează comanda
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-slate-700">
                      Status:{" "}
                      <span className="font-extrabold">{statusLabel(r.status)}</span>
                    </div>

                    {s === "cancelled" && (
                      <div className="text-sm text-slate-600 text-right">
                        Motiv:{" "}
                        <span className="font-semibold">{r.cancel_reason || "-"}</span>
                        {r.cancel_note ? (
                          <span className="text-slate-500"> — {r.cancel_note}</span>
                        ) : null}
                      </div>
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