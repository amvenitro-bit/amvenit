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

  // dacă le ai în tabel, nu strică (altfel rămân undefined)
  accepted_by_name?: string | null;
  accepted_by_phone?: string | null;
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
  let cleaned = raw.trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("07")) cleaned = "+4" + cleaned; // +407...
  if (cleaned.startsWith("0040")) cleaned = "+40" + cleaned.slice(4);
  if (cleaned.startsWith("40") && !cleaned.startsWith("+")) cleaned = "+" + cleaned;
  return cleaned;
}

function buildWhatsAppLink(phone: string, text: string) {
  return `https://wa.me/${normalizePhone(phone).replace("+", "")}?text=${encodeURIComponent(text)}`;
}

function buildSmsLink(phone: string, text: string) {
  return `sms:${normalizePhone(phone)}?&body=${encodeURIComponent(text)}`;
}

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

  // Modal Accept (PIN-only)
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [acceptPin, setAcceptPin] = useState("");
  const [acceptErr, setAcceptErr] = useState<string | null>(null);
  const [acceptBusy, setAcceptBusy] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  async function load() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    setOrders((data as Order[]) || []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
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

  async function confirmAccept() {
    if (!selectedOrder) return;
    const pin = acceptPin.trim();
    if (!pin) {
      setAcceptErr("Scrie PIN-ul.");
      return;
    }

    setAcceptBusy(true);
    setAcceptErr(null);

    try {
      // 1) găsim livratorul după PIN (și să fie activ)
      const { data: courier, error: cErr } = await supabase
        .from("couriers")
        .select("name, phone, pin, active")
        .eq("active", true)
        .eq("pin", pin)
        .maybeSingle();

      if (cErr) throw new Error(cErr.message);
      if (!courier) {
        setAcceptErr("PIN greșit sau livrator neaprobat.");
        setAcceptBusy(false);
        return;
      }

      // 2) acceptăm comanda doar dacă încă e activă
      // În codul tău vechi status era "active"/"completed".
      // Ținem asta ca să nu-ți stricăm istoricul.
      const { data: updated, error: uErr } = await supabase
        .from("orders")
        .update({
          status: "completed",
          accepted_at: new Date().toISOString(),
          accepted_by_name: courier.name,
          accepted_by_phone: courier.phone,
        })
        .eq("id", selectedOrder.id)
        .in("status", [null, "active"])
        .select("id")
        .maybeSingle();

      if (uErr) throw new Error(uErr.message);

      if (!updated) {
        setAcceptErr("Comanda a fost deja acceptată de altcineva.");
        setAcceptBusy(false);
        return;
      }

      closeAccept();
      await load();
      alert(`Comandă acceptată.`);
    } catch (e: any) {
      setAcceptErr(e?.message || "Eroare la acceptare.");
      setAcceptBusy(false);
    }
  }

  const active = orders.filter((o) => (o.status ?? "active") === "active");
  const completed = orders.filter((o) => o.status === "completed");

  return (
    <main className="min-h-screen bg-orange-50 p-6 flex justify-center text-gray-900">
      <div className="w-full max-w-2xl space-y-8">
        {/* HEADER */}
        <header className="text-center space-y-3">
          <h1 className={`${brandFont.className} text-5xl font-bold text-orange-600`}>
            Amvenit.ro
          </h1>
          <p className="text-gray-800">
            Spune ce ai nevoie apăsând butonul de mai jos.
          </p>

          <Link
            href="/cerere"
            className="inline-block rounded-full bg-orange-600 hover:bg-orange-700 px-8 py-4 text-lg font-semibold text-white shadow"
          >
            Plasează o comandă
          </Link>
        </header>

        {/* CERERI ACTIVE */}
        <section className="bg-white rounded-2xl p-6 shadow space-y-4 text-gray-900">
          <h2 className="text-xl font-bold text-gray-900">Cereri active</h2>

          {active.length === 0 ? (
            <div className="text-gray-700">Momentan nu sunt cereri active.</div>
          ) : (
            active.map((o) => (
              <div
                key={o.id}
                className="border border-gray-200 rounded-2xl p-5 bg-white text-gray-900"
              >
                {/* Nume / Localitate */}
                <div className="text-center text-xl font-extrabold text-gray-900">
                  {o.who_where}
                </div>

                {/* Produse */}
                <div className="text-center text-lg mt-1 text-gray-900">
                  {o.what}
                </div>

                {/* Urgent + data */}
                <div className="mt-3 flex flex-col items-center gap-2">
                  {o.urgent && (
                    <span className="rounded-full bg-red-100 text-red-800 px-4 py-2 text-xs font-bold">
                      URGENT (
                      <span className="font-extrabold text-sm">+10 LEI</span> la total „produse
                      + transport + 10 lei”)
                    </span>
                  )}
                  <div className="text-xs text-gray-600">
                    {formatTime(o.created_at)}
                  </div>
                </div>

                {/* BUTOANE */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {/* Chat */}
                  <button
                    onClick={() => openChat(o)}
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

                  {/* Sună */}
                  <a
                    href={`tel:${normalizePhone(o.phone || "")}`}
                    className="text-center rounded-full border border-orange-200 bg-orange-50 hover:bg-orange-100 py-3 text-sm font-semibold text-orange-700"
                  >
                    Sună
                  </a>
                </div>
              </div>
            ))
          )}

          {/* ISTORIC */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">
              Comenzi completate (istoric)
            </h3>
            <div className="mt-2 space-y-2">
              {completed.length === 0 ? (
                <div className="text-sm text-gray-500">Nicio comandă completată încă.</div>
              ) : (
                completed.map((o) => (
                  <div
                    key={o.id}
                    className="bg-gray-100 text-gray-600 rounded-xl px-4 py-3"
                  >
                    <div className="font-semibold text-gray-700">{o.who_where}</div>
                    <div className="text-xs text-gray-600">{formatTime(o.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="text-xs text-gray-600 pt-4">
            * Platformă de intermediere. Livratorii sunt responsabili de livrare.
          </p>
        </section>
      </div>

      {/* POPUP CHAT */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3 text-gray-900">
            <div className="font-bold text-gray-900">Chat pentru: {chatTitle}</div>

            <a
              href={buildWhatsAppLink(chatPhone, chatText)}
              className="block text-center rounded-xl bg-green-600 py-3 text-white font-semibold"
            >
              WhatsApp
            </a>

            <a
              href={buildSmsLink(chatPhone, chatText)}
              className="block text-center rounded-xl bg-blue-600 py-3 text-white font-semibold"
            >
              Mesaj normal
            </a>

            <button
              onClick={() => setChatOpen(false)}
              className="w-full rounded-xl border border-gray-300 py-3 text-gray-900"
            >
              Închide
            </button>
          </div>
        </div>
      )}

      {/* POPUP ACCEPT (PIN only) */}
      {acceptOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 text-gray-900">
            <div className="text-3xl font-black">Acceptă comanda</div>
            <div className="text-gray-700">
              Introdu PIN-ul primit de la admin.
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">PIN</label>
              <input
                value={acceptPin}
                onChange={(e) => setAcceptPin(e.target.value)}
                placeholder="Ex: 123456"
                className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            {/* Link mic */}
            <div className="text-center text-sm">
              <Link href="/devino-livrator" className="text-orange-700 hover:text-orange-800 underline">
                Nu ai PIN? Devino livrator
              </Link>
            </div>

            {acceptErr && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {acceptErr}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={closeAccept}
                disabled={acceptBusy}
                className="rounded-2xl border border-gray-400 py-4 text-xl font-extrabold text-gray-900 bg-white hover:bg-gray-50"
              >
                Renunță
              </button>

              <button
                onClick={confirmAccept}
                disabled={acceptBusy}
                className="rounded-2xl bg-green-600 hover:bg-green-700 py-4 text-xl font-extrabold text-white shadow"
              >
                {acceptBusy ? "Se verifică..." : "Confirmă"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}