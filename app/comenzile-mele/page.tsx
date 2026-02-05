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

  const backHref = useMemo(() => "/", []);

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
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (!isClient && !isCourierOwner) {
      setErr("Nu ai dreptul să anulezi această comandă.");
      setConfirmOpen(false);
      return;
    }

    // livrator: motiv obligatoriu
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
          cancel_reason: isCourierOwner ? "Anulare livrator" : "Anulare client",
          cancel_note: isCourierOwner ? note.trim() : null,
        })
        .eq("id", selectedOrder.id);

      // filtre RLS (obligatorii)
      if (isCourierOwner) {
        query = query.eq("accepted_by_id", userId).eq("status", "accepted");
      } else {
        query = query.eq("client_id", userId).eq("status", "active");
      }

      const { error } = await query;
      if (error) throw new Error(error.message);

      setConfirmOpen(false);
      setSelectedOrder(null);
      setNote("");

      await loadOrders();
    } catch (e: any) {
      setErr(e?.message ?? "Nu s-a putut anula comanda.");
    } finally {
      setCancelBusy(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-white/80 font-semibold">Se încarcă…</div>

        {/* background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative px-6 py-10 overflow-hidden">
      {/* BACKGROUND identic cu /comenzi */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      {/* POPUP ANULARE */}
      {confirmOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-7 border border-black/10">
            <div className="text-2xl font-extrabold text-slate-900">
              Ești sigur că anulezi comanda?
            </div>

            {selectedOrder.accepted_by_id === userId && (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Scrie motivul anulării…"
                className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            )}

            {err && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
                {err}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={doCancel}
                disabled={cancelBusy}
                className="flex-1 rounded-full bg-red-600 px-6 py-3 font-extrabold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelBusy ? "Se anulează..." : "Da, anulează"}
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

      <div className="max-w-3xl mx-auto">
        {/* TOP ca la /comenzi */}
        <div className="text-center">
          <Link
            href={backHref}
            className="inline-block text-sm font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-4"
          >
            ← Înapoi
          </Link>

          <h1 className="mt-6 text-5xl font-extrabold text-white">amvenit.ro</h1>
          <p className="mt-3 text-white/80">Comenzile mele</p>
        </div>

        {err && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
            {err}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white/85 backdrop-blur border border-black/5 shadow-xl p-8 text-center text-slate-700 font-semibold">
            Nu ai comenzi.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {rows.map((r) => {
              const isClientOwner = r.client_id === userId;
              const isCourierOwner = r.accepted_by_id === userId;
              const s = (r.status || "").toLowerCase();

              // client: doar când e active
              const clientCanCancel = isClientOwner && s === "active";

              // livrator: doar când e accepted
              const courierCanCancel = isCourierOwner && s === "accepted";

              const canCancel = clientCanCancel || courierCanCancel;

              return (
                <div
                  key={r.id}
                  className="rounded-3xl bg-white/85 backdrop-blur border border-black/5 shadow-xl p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xl font-extrabold text-slate-900">
                        {r.what}
                        {r.urgent ? (
                          <span className="ml-2 inline-block rounded-full bg-orange-600 text-white px-3 py-1 text-xs font-extrabold">
                            URGENT
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 text-slate-700">{r.who_where}</div>

                      <div className="mt-2 text-sm text-slate-600">
                        {new Date(r.created_at).toLocaleString("ro-RO")}
                      </div>

                      <div className="mt-2 text-sm font-semibold text-slate-700">
                        Status:{" "}
                        <span className="font-extrabold">
                          {statusLabel(r.status)}
                        </span>
                      </div>

                      {s === "cancelled" && (
                        <div className="mt-2 text-sm text-slate-700">
                          Motiv:{" "}
                          <span className="font-semibold">
                            {r.cancel_reason || "-"}
                          </span>
                          {r.cancel_note ? (
                            <span className="text-slate-500">
                              {" "}
                              — {r.cancel_note}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}