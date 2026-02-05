"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type Accordion = "none" | "completed" | "cancelled";

export default function ComenzileMelePage() {
  const router = useRouter();
  const { authLoading, userId } = useAuth();

  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ dropdown state
  const [open, setOpen] = useState<Accordion>("none");

  // popup anulare
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [note, setNote] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  // livrat
  const [deliverBusyId, setDeliverBusyId] = useState<string | null>(null);

  const backHref = useMemo(() => "/", []);

  // pt “revine sus pe Comenzi active”
  const activeTopRef = useRef<HTMLDivElement | null>(null);

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
  }, [userId]);

  const acceptedRows = useMemo(() => {
    const list = rows.filter((r) => (r.status || "").toLowerCase() === "accepted");
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [rows]);

  const completedRows = useMemo(() => {
    const list = rows.filter((r) => (r.status || "").toLowerCase() === "completed");
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [rows]);

  const cancelledRows = useMemo(() => {
    const list = rows.filter((r) => (r.status || "").toLowerCase() === "cancelled");
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [rows]);

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
      // deschidem anulate în jos (opțional)
      setOpen("cancelled");
    } catch (e: any) {
      setErr(e?.message ?? "Nu s-a putut anula comanda.");
    } finally {
      setCancelBusy(false);
    }
  }

  async function markDelivered(order: OrderRow) {
    if (!userId) return;

    const s = (order.status || "").toLowerCase();
    const isCourierOwner = order.accepted_by_id === userId;

    if (!isCourierOwner || s !== "accepted") {
      setErr("Nu poți marca livrarea la comanda asta.");
      return;
    }

    const ok = window.confirm("Confirmi că ai livrat comanda?");
    if (!ok) return;

    setDeliverBusyId(order.id);
    setErr(null);

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", order.id)
        .eq("accepted_by_id", userId)
        .eq("status", "accepted");

      if (error) throw new Error(error.message);

      await loadOrders();
      // deschidem finalizate în jos (opțional)
      setOpen("completed");
    } catch (e: any) {
      setErr(e?.message ?? "Nu s-a putut marca drept livrat.");
    } finally {
      setDeliverBusyId(null);
    }
  }

  function goActive() {
    // ✅ închidem dropdown-urile și mergem la “Comenzi active”
    setOpen("none");
    requestAnimationFrame(() => {
      activeTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function toggle(section: Accordion) {
    // ✅ dropdown doar în jos (deschidem sub buton)
    setOpen((cur) => (cur === section ? "none" : section));
    requestAnimationFrame(() => {
      // scroll la butoane ca să vezi că s-a deschis
      // (nu afectează active/verde, doar te ajută pe mobil)
      if (section !== "none") {
        const el = document.getElementById(`section-${section}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function renderOrderCard(r: OrderRow, variant: "green" | "normal") {
    const s = (r.status || "").toLowerCase();
    const isGreen = variant === "green";
    const isCourierOwner = r.accepted_by_id === userId;

    // în pagină asta (accepted), anularea e doar pt livrator pe accepted
    const canCancel = isCourierOwner && s === "accepted";

    return (
      <div
        key={r.id}
        className={[
          "rounded-3xl border shadow-xl p-6",
          isGreen ? "bg-green-600 border-green-700/40" : "bg-white/85 backdrop-blur border-black/5",
        ].join(" ")}
      >
        <div className="flex items-stretch justify-between gap-4">
          <div className="min-w-0">
            <div className={["text-xl font-extrabold", isGreen ? "text-white" : "text-slate-900"].join(" ")}>
              {r.what}
              {r.urgent ? (
                <span className="ml-2 inline-block rounded-full bg-orange-600 text-white px-3 py-1 text-xs font-extrabold">
                  URGENT
                </span>
              ) : null}
            </div>

            <div className={["mt-2", isGreen ? "text-white/90" : "text-slate-700"].join(" ")}>
              {r.who_where}
            </div>

            <div className={["mt-2 text-sm", isGreen ? "text-white/80" : "text-slate-600"].join(" ")}>
              {new Date(r.created_at).toLocaleString("ro-RO")}
            </div>

            <div className={["mt-2 text-sm font-semibold", isGreen ? "text-white/90" : "text-slate-700"].join(" ")}>
              Status: <span className="font-extrabold">{statusLabel(r.status)}</span>
            </div>

            {s === "cancelled" && (
              <div className={["mt-2 text-sm", isGreen ? "text-white/90" : "text-slate-700"].join(" ")}>
                Motiv: <span className="font-semibold">{r.cancel_reason || "-"}</span>
                {r.cancel_note ? (
                  <span className={isGreen ? "text-white/80" : "text-slate-500"}> — {r.cancel_note}</span>
                ) : null}
              </div>
            )}
          </div>

          {/* ✅ Butoane dreapta: centrate + same size */}
          <div className="shrink-0 flex flex-col justify-center items-end gap-3">
            {variant === "green" && isCourierOwner && s === "accepted" && (
              <button
                type="button"
                onClick={() => markDelivered(r)}
                disabled={deliverBusyId === r.id}
                className="min-w-[130px] rounded-full bg-orange-600 px-4 py-2 text-white font-extrabold hover:bg-orange-700 disabled:opacity-60"
              >
                {deliverBusyId === r.id ? "Se salvează..." : "Am livrat"}
              </button>
            )}

            {variant === "green" && canCancel && (
              <button
                onClick={() => startCancel(r)}
                className="min-w-[130px] rounded-full bg-red-50 border border-red-300 px-4 py-2 text-red-700 font-extrabold hover:bg-red-100"
              >
                Anulează
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-white/80 font-semibold">Se încarcă…</div>
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative px-6 py-10 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      {/* POPUP ANULARE */}
      {confirmOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-7 border border-black/10">
            <div className="text-2xl font-extrabold text-slate-900">Ești sigur că anulezi comanda?</div>

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
        {/* TOP */}
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

        {/* TITLU ACTIVE */}
        <div className="mt-10 text-center" ref={activeTopRef}>
          <h2 className="text-3xl font-extrabold text-white">Comenzi active</h2>
          <p className="mt-2 text-white/70 text-sm">
            Aici vezi doar comenzile acceptate (în lucru).
          </p>
        </div>

        {/* BUTON ACTIVE (rămâne “ancoră”) */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={goActive}
            className="w-full sm:w-[360px] rounded-full px-6 py-3 font-extrabold shadow-xl border bg-orange-600 text-white border-orange-700/30"
          >
            Comenzi active
          </button>
        </div>

        {err && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
            {err}
          </div>
        )}

        {/* ✅ CARDURI VERZI (FIX SUB BUTON) */}
        {acceptedRows.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white/85 backdrop-blur border border-black/5 shadow-xl p-8 text-center text-slate-700 font-semibold">
            Nu ai comenzi active.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {acceptedRows.map((r) => renderOrderCard(r, "green"))}
          </div>
        )}

        {/* ✅ DROPDOWN BUTTONS SUB LISTA VERDE */}
        <div className="mt-10 flex flex-col items-center gap-3">
          {/* COMPLETED */}
          <div className="w-full sm:w-[360px]" id="section-completed">
            <button
              type="button"
              onClick={() => toggle("completed")}
              className={`w-full rounded-full px-6 py-3 font-extrabold shadow-xl border ${
                open === "completed"
                  ? "bg-white text-slate-900 border-white/70"
                  : "bg-white/10 text-white border-white/10 hover:bg-white/15"
              }`}
            >
              Comenzi finalizate
            </button>

            {open === "completed" && (
              <div className="mt-4 space-y-4">
                {completedRows.length === 0 ? (
                  <div className="rounded-3xl bg-white/85 backdrop-blur border border-black/5 shadow-xl p-6 text-center text-slate-700 font-semibold">
                    Nu ai comenzi finalizate.
                  </div>
                ) : (
                  completedRows.map((r) => renderOrderCard(r, "normal"))
                )}
              </div>
            )}
          </div>

          {/* CANCELLED */}
          <div className="w-full sm:w-[360px]" id="section-cancelled">
            <button
              type="button"
              onClick={() => toggle("cancelled")}
              className={`w-full rounded-full px-6 py-3 font-extrabold shadow-xl border ${
                open === "cancelled"
                  ? "bg-white text-slate-900 border-white/70"
                  : "bg-white/10 text-white border-white/10 hover:bg-white/15"
              }`}
            >
              Comenzi anulate
            </button>

            {open === "cancelled" && (
              <div className="mt-4 space-y-4">
                {cancelledRows.length === 0 ? (
                  <div className="rounded-3xl bg-white/85 backdrop-blur border border-black/5 shadow-xl p-6 text-center text-slate-700 font-semibold">
                    Nu ai comenzi anulate.
                  </div>
                ) : (
                  cancelledRows.map((r) => renderOrderCard(r, "normal"))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}