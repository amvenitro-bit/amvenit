"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Order = {
  id: string;
  created_at: string;
  what: string | null;
  who_where: string | null;
  phone: string | null;
  urgent: boolean | null;
  status: string | null;
  accepted_at: string | null;
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
  if (cleaned.startsWith("07")) cleaned = "+4" + cleaned;
  if (cleaned.startsWith("0040")) cleaned = "+40" + cleaned.slice(4);
  if (cleaned.startsWith("40") && !cleaned.startsWith("+")) cleaned = "+" + cleaned;
  return cleaned;
}

function buildWhatsAppLink(phone: string, text: string) {
  return `https://wa.me/${normalizePhone(phone).replace("+", "")}?text=${encodeURIComponent(
    text
  )}`;
}

function buildSmsLink(phone: string, text: string) {
  return `sms:${normalizePhone(phone)}?&body=${encodeURIComponent(text)}`;
}

export default function ComenziPage() {
  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // PIN gating
  const [pin, setPin] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [pinOk, setPinOk] = useState(false);

  // modal accept
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<Order | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinErr, setPinErr] = useState<string | null>(null);

  // chat modal
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPhone, setChatPhone] = useState("");
  const [chatText, setChatText] = useState("");
  const [chatTitle, setChatTitle] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    setOrders((data as Order[]) || []);
    setLoading(false);
  }

  async function validatePin(p: string) {
    const cleaned = p.trim();
    if (!cleaned) return false;

    const { data } = await supabase
      .from("couriers")
      .select("id, pin, active")
      .eq("pin", cleaned)
      .eq("active", true)
      .maybeSingle();

    return !!data;
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("courier_pin") || "";
    if (saved) {
      setPin(saved);
      setHasPin(true);
      validatePin(saved).then((ok) => setPinOk(ok));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = orders.filter((o) => (o.status ?? "active") === "active");
  const completed = orders.filter((o) => o.status === "completed");

  function requirePinThen(action: () => void) {
    if (pinOk) return action();
    setPinErr(null);
    setPinInput("");
    setAcceptTarget(null);
    setAcceptOpen(true);
  }

  async function confirmPinOnly() {
    setPinErr(null);
    const ok = await validatePin(pinInput);
    if (!ok) {
      setPinErr("PIN invalid.");
      return;
    }
    localStorage.setItem("courier_pin", pinInput.trim());
    setPin(pinInput.trim());
    setHasPin(true);
    setPinOk(true);
    setAcceptOpen(false);
  }

  function openAccept(o: Order) {
    if (pinOk) {
      setAcceptTarget(o);
      setPinErr(null);
      setAcceptOpen(true);
      return;
    }
    // dacă nu are PIN, deschidem modal doar pentru PIN
    setAcceptTarget(o);
    setPinErr(null);
    setAcceptOpen(true);
  }

  async function acceptOrder(o: Order) {
    await supabase
      .from("orders")
      .update({ status: "completed", accepted_at: new Date().toISOString() })
      .eq("id", o.id);

    setAcceptOpen(false);
    setAcceptTarget(null);
    load();
  }

  function openChat(o: Order) {
    if (!o.phone) return;
    setChatPhone(o.phone);
    setChatTitle(o.who_where || "");
    setChatText(
      `Salut! Am văzut cererea ta pe amvenit.ro: "${o.what}". Sunt disponibil să ajut.`
    );
    setChatOpen(true);
  }

  return (
    <main className="min-h-screen relative px-5 py-14">
      {/* BACKGROUND ca pe home */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-hero-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-block text-sm font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-4"
          >
            ← Înapoi
          </Link>

          <h1 className="mt-5 text-5xl font-extrabold text-slate-900">
            amvenit.ro
          </h1>
          <p className="mt-3 text-base md:text-lg text-slate-600">
            Comenzi active
          </p>
        </div>

        <section className="bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-black/5 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-lg font-extrabold text-slate-900">Cereri active</div>

            <div className="text-sm text-slate-600">
              {hasPin && pinOk ? (
                <span className="font-semibold">
                  PIN activ ✅
                </span>
              ) : (
                <button
                  onClick={() => requirePinThen(() => {})}
                  className="underline text-orange-700 hover:text-orange-800 font-semibold"
                >
                  Introdu PIN ca să vezi Chat/Sună
                </button>
              )}
            </div>
          </div>

          {loading && <div className="text-slate-600">Se încarcă...</div>}

          {!loading && active.length === 0 && (
            <div className="text-slate-600">Nu sunt cereri active.</div>
          )}

          <div className="space-y-4">
            {active.map((o) => (
              <div key={o.id} className="border border-slate-200 rounded-3xl p-6 bg-white">
                <div className="text-center text-xl font-extrabold text-slate-900">
                  {o.who_where}
                </div>

                <div className="text-center text-lg mt-1 text-slate-800">
                  {o.what}
                </div>

                <div className="mt-3 flex flex-col items-center gap-2">
                  {o.urgent && (
                    <span className="rounded-full bg-red-100 text-red-800 px-4 py-2 text-xs font-bold">
                      URGENT (
                      <span className="font-extrabold text-sm">+10 LEI</span> la total dacă ajungi
                      în 30 minute de la acceptarea comenzii.)
                    </span>
                  )}
                  <div className="text-xs text-slate-500">
                    {formatTime(o.created_at)}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {/* Chat - doar cu PIN */}
                  <button
                    onClick={() => (pinOk ? openChat(o) : openAccept(o))}
                    className="rounded-full border border-orange-200 bg-orange-50 hover:bg-orange-100 py-3 text-sm font-semibold text-orange-700"
                  >
                    Chat
                  </button>

                  {/* Acceptă */}
                  <button
                    onClick={() => openAccept(o)}
                    className="rounded-full bg-green-600 hover:bg-green-700 py-4 text-base font-extrabold text-white shadow"
                  >
                    Acceptă
                  </button>

                  {/* Sună - doar cu PIN */}
                  {pinOk ? (
                    <a
                      href={`tel:${normalizePhone(o.phone || "")}`}
                      className="text-center rounded-full border border-orange-200 bg-orange-50 hover:bg-orange-100 py-3 text-sm font-semibold text-orange-700"
                    >
                      Sună
                    </a>
                  ) : (
                    <button
                      onClick={() => openAccept(o)}
                      className="rounded-full border border-orange-200 bg-orange-50 hover:bg-orange-100 py-3 text-sm font-semibold text-orange-700"
                    >
                      Sună
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ISTORIC */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-700">
              Comenzi completate (istoric)
            </h3>
            <div className="mt-2 space-y-2">
              {completed.map((o) => (
                <div
                  key={o.id}
                  className="bg-slate-100 text-slate-600 rounded-2xl px-4 py-3"
                >
                  <div className="font-semibold">{o.who_where}</div>
                  <div className="text-xs">{formatTime(o.created_at)}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-2">
            * Platformă de intermediere. Livratorii sunt responsabili de livrare.
          </p>
        </section>
      </div>

      {/* MODAL PIN / ACCEPT */}
      {acceptOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="text-2xl font-extrabold text-slate-900">
              Acceptă comanda
            </div>

            <div className="text-slate-600">
              Introdu PIN-ul primit de la admin.
            </div>

            <div>
              <label className="block font-bold text-slate-900">PIN</label>
              <input
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ex: 123456"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {pinErr && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 font-semibold">
                {pinErr}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setAcceptOpen(false);
                  setAcceptTarget(null);
                }}
                className="rounded-full border py-3 font-bold"
              >
                Renunță
              </button>

              <button
                onClick={async () => {
                  const ok = await validatePin(pinInput);
                  if (!ok) {
                    setPinErr("PIN invalid.");
                    return;
                  }
                  localStorage.setItem("courier_pin", pinInput.trim());
                  setPin(pinInput.trim());
                  setHasPin(true);
                  setPinOk(true);

                  // dacă avem o comandă selectată, o acceptăm imediat
                  if (acceptTarget) {
                    await acceptOrder(acceptTarget);
                  } else {
                    setAcceptOpen(false);
                  }
                }}
                className="rounded-full bg-green-600 hover:bg-green-700 py-3 font-extrabold text-white"
              >
                Confirmă
              </button>
            </div>

            <div className="text-center text-sm pt-2">
              <Link
                href="/devino-livrator"
                className="text-orange-700 hover:text-orange-800 underline"
              >
                Nu ai PIN? Devino livrator
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* POPUP CHAT */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-3">
            <div className="font-extrabold text-slate-900">
              Chat pentru: {chatTitle}
            </div>

            <a
              href={buildWhatsAppLink(chatPhone, chatText)}
              className="block text-center rounded-2xl bg-green-600 py-3 text-white font-extrabold"
            >
              WhatsApp
            </a>

            <a
              href={buildSmsLink(chatPhone, chatText)}
              className="block text-center rounded-2xl bg-blue-600 py-3 text-white font-extrabold"
            >
              Mesaj normal
            </a>

            <button
              onClick={() => setChatOpen(false)}
              className="w-full rounded-2xl border py-3 font-bold"
            >
              Închide
            </button>
          </div>
        </div>
      )}
    </main>
  );
}