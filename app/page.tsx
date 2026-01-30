"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Poppins } from "next/font/google";

const brandFont = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
});

type Order = {
  id: string;
  created_at: string;
  what: string | null;
  who_where: string | null;
  phone: string | null;
  urgent: boolean | null;
  status: string | null;
  accepted_at: string | null;

  accepted_by_name?: string | null;
  accepted_by_phone?: string | null;
};

type Courier = {
  id: string;
  name: string;
  phone: string;
  pin: string;
  active: boolean;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ro-RO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizePhone(raw: string) {
  let cleaned = String(raw || "").trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("07")) cleaned = "+4" + cleaned;
  if (cleaned.startsWith("0040")) cleaned = "+40" + cleaned.slice(4);
  if (cleaned.startsWith("40") && !cleaned.startsWith("+")) cleaned = "+" + cleaned;
  return cleaned;
}

function buildWhatsAppLink(phone: string, text: string) {
  const digits = normalizePhone(phone).replace("+", "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function buildSmsLink(phone: string, text: string) {
  return `sms:${normalizePhone(phone)}?&body=${encodeURIComponent(text)}`;
}

const LS_PIN = "amvenit_courier_pin_v1";

export default function HomePage() {
  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPhone, setChatPhone] = useState("");
  const [chatText, setChatText] = useState("");
  const [chatTitle, setChatTitle] = useState("");

  // Accept modal (PIN only)
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [acceptPin, setAcceptPin] = useState("");
  const [acceptBusy, setAcceptBusy] = useState(false);
  const [acceptErr, setAcceptErr] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // PIN gate (pentru Chat/Sună)
  const [pinGateOpen, setPinGateOpen] = useState(false);
  const [pinGatePin, setPinGatePin] = useState("");
  const [pinGateErr, setPinGateErr] = useState<string | null>(null);
  const [pinGateBusy, setPinGateBusy] = useState(false);
  const [verifiedCourier, setVerifiedCourier] = useState<Courier | null>(null);

  // acțiunea pe care o vrea userul după ce bagă PIN (chat/suna)
  const [pendingAction, setPendingAction] = useState<null | { type: "chat" | "call"; order: Order }>(
    null
  );

  async function load() {
    const { data } = await supabase
      .from("orders")
      .select(
        "id, created_at, what, who_where, phone, urgent, status, accepted_at, accepted_by_name, accepted_by_phone"
      )
      .order("created_at", { ascending: false });

    setOrders((data as Order[]) || []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  // Reîncarcă PIN-ul (dacă există) și verifică-l o singură dată la pornire
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(LS_PIN) : null;
    if (!saved) return;

    (async () => {
      const pin = saved.trim();
      if (!pin) return;

      const { data: courier, error } = await supabase
        .from("couriers")
        .select("id, name, phone, pin, active")
        .eq("active", true)
        .eq("pin", pin)
        .maybeSingle();

      if (!error && courier) {
        setVerifiedCourier(courier as Courier);
      } else {
        window.localStorage.removeItem(LS_PIN);
      }
    })();
  }, []);

  function openChat(o: Order) {
    if (!o.phone) return;
    setChatPhone(o.phone);
    setChatTitle(o.who_where || "");
    setChatText(`Salut! Am văzut cererea ta pe Amvenit.ro: "${o.what}". Sunt disponibil să ajut.`);
    setChatOpen(true);
  }

  function openAccept(o: Order) {
    setSelectedOrder(o);
    setAcceptPin("");
    setAcceptErr(null);
    setAcceptOpen(true);
  }

  function closeAccept() {
    setAcceptOpen(false);
    setSelectedOrder(null);
    setAcceptPin("");
    setAcceptErr(null);
    setAcceptBusy(false);
  }

  function openPinGate(action: { type: "chat" | "call"; order: Order }) {
    setPendingAction(action);
    setPinGatePin("");
    setPinGateErr(null);
    setPinGateBusy(false);
    setPinGateOpen(true);
  }

  function closePinGate() {
    setPinGateOpen(false);
    setPinGatePin("");
    setPinGateErr(null);
    setPinGateBusy(false);
    setPendingAction(null);
  }

  async function verifyPinForGate() {
    const pin = pinGatePin.trim();
    if (!pin) {
      setPinGateErr("Introdu PIN-ul.");
      return;
    }

    setPinGateBusy(true);
    setPinGateErr(null);

    try {
      const { data: courier, error } = await supabase
        .from("couriers")
        .select("id, name, phone, pin, active")
        .eq("active", true)
        .eq("pin", pin)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!courier) {
        setPinGateErr("PIN greșit sau livrator neaprobat.");
        setPinGateBusy(false);
        return;
      }

      const c = courier as Courier;
      setVerifiedCourier(c);
      window.localStorage.setItem(LS_PIN, pin);

      // Execută acțiunea cerută
      if (pendingAction) {
        const o = pendingAction.order;

        if (pendingAction.type === "chat") {
          closePinGate();
          openChat(o);
          return;
        }

        if (pendingAction.type === "call") {
          const phone = o.phone ? normalizePhone(o.phone) : "";
          closePinGate();
          if (!phone) return;
          window.location.href = `tel:${phone}`;
          return;
        }
      }

      closePinGate();
    } catch (e: any) {
      setPinGateErr(e?.message || "Eroare la verificare PIN.");
      setPinGateBusy(false);
    }
  }

  function logoutCourier() {
    setVerifiedCourier(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(LS_PIN);
  }

  async function confirmAccept() {
    if (!selectedOrder) return;

    const pin = acceptPin.trim();
    if (!pin) {
      setAcceptErr("Introdu PIN-ul.");
      return;
    }

    setAcceptBusy(true);
    setAcceptErr(null);

    try {
      // 1) Verific PIN în couriers (doar active)
      const { data: courier, error: cErr } = await supabase
        .from("couriers")
        .select("id, name, phone, pin, active")
        .eq("active", true)
        .eq("pin", pin)
        .maybeSingle();

      if (cErr) throw new Error(cErr.message);
      if (!courier) {
        setAcceptErr("PIN greșit sau livrator neaprobat.");
        setAcceptBusy(false);
        return;
      }

      const c = courier as Courier;

      // 2) Acceptă comanda (mutăm în istoric)
      const { data: updated, error: uErr } = await supabase
        .from("orders")
        .update({
          status: "completed",
          accepted_at: new Date().toISOString(),
          accepted_by_name: c.name,
          accepted_by_phone: c.phone,
        })
        .eq("id", selectedOrder.id)
        .in("status", [null, "active"])
        .select("id, phone, who_where, what, urgent")
        .maybeSingle();

      if (uErr) throw new Error(uErr.message);

      if (!updated) {
        setAcceptErr("Comanda a fost deja acceptată de altcineva.");
        setAcceptBusy(false);
        return;
      }

      // 3) WhatsApp către client cu detalii (livrator -> client)
      const clientPhone = String(updated.phone || "").trim();
      if (clientPhone) {
        const urgentTxt = updated.urgent ? "DA (+10 lei)" : "NU";
        const msg = `Salut! Sunt ${c.name} (livrator Amvenit.ro).
Am acceptat comanda ta.

Nume/Localitate: ${updated.who_where || "-"}
Cerere: ${updated.what || "-"}
URGENT: ${urgentTxt}

Telefon livrator: ${c.phone}

Scrie-mi aici detalii (adresă/loc de întâlnire).`;

        window.open(buildWhatsAppLink(clientPhone, msg), "_blank");
      }

      closeAccept();
      await load();
      alert(`Comandă acceptată de ${c.name}.`);
    } catch (e: any) {
      setAcceptErr(e?.message || "Eroare la acceptare.");
      setAcceptBusy(false);
    }
  }

  const active = orders.filter((o) => (o.status ?? "active") === "active");
  const completed = orders.filter((o) => o.status === "completed");

  return (
    <main className="min-h-screen bg-orange-50 p-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* HEADER */}
        <header className="text-center space-y-3">
          <h1 className={`${brandFont.className} text-5xl font-bold text-orange-600`}>
            Amvenit.ro
          </h1>
          <p className="text-gray-700">Spune ce ai nevoie apăsând butonul de mai jos.</p>

          <Link
            href="/cerere"
            className="inline-block rounded-full bg-orange-600 hover:bg-orange-700 px-8 py-4 text-lg font-semibold text-white shadow"
          >
            Plasează o comandă
          </Link>

          {/* status livrator (mic) */}
          <div className="pt-2 text-sm text-gray-600">
            {verifiedCourier ? (
              <div className="flex items-center justify-center gap-2">
                <span>
                  Livrator: <b>{verifiedCourier.name}</b>
                </span>
                <button
                  onClick={logoutCourier}
                  className="underline text-orange-700 hover:text-orange-800"
                >
                  Ieși
                </button>
              </div>
            ) : (
              <div>
                Pentru Chat/Sună trebuie PIN de livrator.
              </div>
            )}
          </div>
        </header>

        {/* CERERI ACTIVE */}
        <section className="bg-white rounded-2xl p-6 shadow space-y-4">
          <h2 className="text-xl font-bold">Cereri active</h2>

          {active.length === 0 ? (
            <div className="text-sm text-gray-500">Momentan nu sunt cereri active.</div>
          ) : (
            active.map((o) => (
              <div key={o.id} className="border rounded-2xl p-5">
                {/* Nume / Localitate */}
                <div className="text-center text-xl font-extrabold">{o.who_where}</div>

                {/* Produse */}
                <div className="text-center text-lg mt-1">{o.what}</div>

                {/* Urgent + data */}
                <div className="mt-3 flex flex-col items-center gap-2">
                  {o.urgent && (
                    <span className="rounded-full bg-red-100 text-red-800 px-4 py-2 text-xs font-bold">
                      URGENT (
                      <span className="font-extrabold text-sm">+10 LEI</span> la total „produse +
                      transport + 10 lei”)
                    </span>
                  )}
                  <div className="text-xs text-gray-500">{formatTime(o.created_at)}</div>
                </div>

                {/* BUTOANE */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {/* Chat (doar cu PIN) */}
                  <button
                    onClick={() => {
                      if (!verifiedCourier) return openPinGate({ type: "chat", order: o });
                      openChat(o);
                    }}
                    className="rounded-full border border-orange-200 bg-orange-50 hover:bg-orange-100 py-3 text-sm font-semibold text-orange-700"
                  >
                    Chat
                  </button>

                  {/* Acceptă (mai mare) */}
                  <button
                    onClick={() => openAccept(o)}
                    className="rounded-full bg-green-600 hover:bg-green-700 py-4 text-base font-extrabold text-white shadow"
                  >
                    Acceptă
                  </button>

                  {/* Sună (doar cu PIN) */}
                  <button
                    onClick={() => {
                      if (!o.phone) return;
                      if (!verifiedCourier) return openPinGate({ type: "call", order: o });
                      const phone = normalizePhone(o.phone);
                      window.location.href = `tel:${phone}`;
                    }}
                    className="text-center rounded-full border border-orange-200 bg-orange-50 hover:bg-orange-100 py-3 text-sm font-semibold text-orange-700"
                  >
                    Sună
                  </button>
                </div>
              </div>
            ))
          )}

          {/* ISTORIC */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-bold text-gray-700">Comenzi completate (istoric)</h3>
            <div className="mt-2 space-y-2">
              {completed.length === 0 ? (
                <div className="text-xs text-gray-500">Nicio comandă completată încă.</div>
              ) : (
                completed.map((o) => (
                  <div key={o.id} className="bg-gray-100 text-gray-500 rounded-xl px-4 py-3">
                    <div className="font-semibold">{o.who_where}</div>
                    <div className="text-xs">
                      {formatTime(o.created_at)}
                      {o.accepted_by_name ? ` • acceptată de ${o.accepted_by_name}` : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 pt-4">
            * Platformă de intermediere. Livratorii sunt responsabili de livrare.
          </p>
        </section>
      </div>

      {/* POPUP CHAT */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
            <div className="font-bold">Chat pentru: {chatTitle}</div>

            <a
              href={buildWhatsAppLink(chatPhone, chatText)}
              className="block text-center rounded-xl bg-green-600 py-3 text-white font-semibold"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>

            <a
              href={buildSmsLink(chatPhone, chatText)}
              className="block text-center rounded-xl bg-blue-600 py-3 text-white font-semibold"
            >
              Mesaj normal
            </a>

            <button onClick={() => setChatOpen(false)} className="w-full rounded-xl border py-3">
              Închide
            </button>
          </div>
        </div>
      )}

      {/* MODAL PIN GATE (pentru Chat/Sună) */}
      {pinGateOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div>
              <div className="text-2xl font-black">PIN livrator</div>
              <div className="text-gray-600 mt-1">
                Ca să vezi telefonul și să contactezi clientul (Chat/Sună), introdu PIN-ul.
              </div>
            </div>

            <div>
              <label className="font-bold">PIN</label>
              <input
                value={pinGatePin}
                onChange={(e) => setPinGatePin(e.target.value)}
                placeholder="Ex: 123456"
                className="mt-2 w-full rounded-2xl border px-5 py-4 text-lg"
              />
              {pinGateErr && <div className="mt-2 text-sm text-red-600">{pinGateErr}</div>}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={closePinGate}
                disabled={pinGateBusy}
                className="w-1/2 rounded-2xl border py-4 text-lg font-bold"
              >
                Renunță
              </button>

              <button
                onClick={verifyPinForGate}
                disabled={pinGateBusy}
                className="w-1/2 rounded-2xl bg-green-600 hover:bg-green-700 py-4 text-lg font-extrabold text-white"
              >
                {pinGateBusy ? "..." : "Confirmă"}
              </button>
            </div>

            <div className="text-center text-sm">
              <Link href="/devino-livrator" className="text-orange-700 hover:text-orange-800 underline">
                Nu ai PIN? Devino livrator
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACCEPT (PIN only) */}
      {acceptOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div>
              <div className="text-2xl font-black">Acceptă comanda</div>
              <div className="text-gray-600 mt-1">Introdu PIN-ul primit de la admin (rapid).</div>
            </div>

            <div>
              <label className="font-bold">PIN</label>
              <input
                value={acceptPin}
                onChange={(e) => setAcceptPin(e.target.value)}
                placeholder="Ex: 123456"
                className="mt-2 w-full rounded-2xl border px-5 py-4 text-lg"
              />
              {acceptErr && <div className="mt-2 text-sm text-red-600">{acceptErr}</div>}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={closeAccept}
                disabled={acceptBusy}
                className="w-1/2 rounded-2xl border py-4 text-lg font-bold"
              >
                Renunță
              </button>

              <button
                onClick={confirmAccept}
                disabled={acceptBusy}
                className="w-1/2 rounded-2xl bg-green-600 hover:bg-green-700 py-4 text-lg font-extrabold text-white"
              >
                {acceptBusy ? "..." : "Confirmă"}
              </button>
            </div>

            <div className="text-center text-sm">
              <Link href="/devino-livrator" className="text-orange-700 hover:text-orange-800 underline">
                Nu ai PIN? Devino livrator
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}