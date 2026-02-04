"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type OrderRow = {
  id: string;
  created_at: string;
  what: string;
  who_where: string;
  phone: string | null;
  urgent: boolean | null;
  status: string | null;

  accepted_at?: string | null;
  accepted_by_id?: string | null;
  accepted_by_name?: string | null;
  accepted_by_phone?: string | null;
};

function maskPhone(phone: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "07********";
  const start = phone.slice(0, Math.min(4, phone.length));
  const end = phone.slice(-3);
  return `${start}*****${end}`;
}

function firstPart(s: string) {
  return (s || "").split("•")[0]?.trim() || s || "";
}

function secondPart(s: string) {
  const parts = (s || "").split("•");
  return (parts[1] || "").trim();
}

export default function ComenziPage() {
  const router = useRouter();
  const { userId, role, authLoading } = useAuth();

  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const isLoggedIn = !!userId;
  const canAccept = !!userId && role === "courier";

  const nextHref = useMemo(() => encodeURIComponent("/comenzi"), []);
  const loginHref = `/conectare?next=${nextHref}`;
  const registerHref = `/inregistrare?next=${nextHref}`;

  async function load() {
    setErr(null);
    setLoading(true);

    try {
      // IMPORTANT:
      // - afișăm doar comenzi "active" care NU sunt acceptate
      // - asta face ca ele să dispară imediat din "Cereri active" pentru anon
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, created_at, what, who_where, phone, urgent, status, accepted_at, accepted_by_id, accepted_by_name, accepted_by_phone"
        )
        .eq("status", "active")
        .is("accepted_by_id", null)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      setRows((data || []) as OrderRow[]);
    } catch (e: any) {
      setErr(e?.message ?? "Eroare la încărcare comenzi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function acceptOrder(orderId: string) {
    if (!canAccept) return;

    try {
      const { data: u, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw new Error(uErr.message);
      if (!u?.user) throw new Error("Trebuie să fii logat.");

      // profilul livratorului (nume/telefon)
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("full_name, phone, role")
        .eq("id", u.user.id)
        .single();

      if (pErr) throw new Error(pErr.message);
      if (!prof || prof.role !== "courier") {
        throw new Error("Doar livratorii pot accepta comenzi.");
      }

      // UPDATE cu protecție anti-dublu-accept:
      // - status încă active
      // - accepted_by_id încă null
      const { error } = await supabase
        .from("orders")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_by_id: u.user.id,
          accepted_by_name: prof.full_name ?? null,
          accepted_by_phone: prof.phone ?? null,
        })
        .eq("id", orderId)
        .eq("status", "active")
        .is("accepted_by_id", null);

      if (error) {
        // aici intră fix eroarea ta: RLS
        throw new Error(error.message);
      }

      // refresh listă (comanda dispare de aici)
      await load();

      // du-l direct în comenzile lui
      router.push("/comenzile-mele");
    } catch (e: any) {
      alert(e?.message ?? "Nu s-a putut accepta comanda.");
    }
  }

  return (
    <main className="min-h-screen relative px-6 py-10 overflow-hidden">
      {/* BACKGROUND identic cu Home */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      <div className="max-w-3xl mx-auto">
        {/* TOP */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block text-sm font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-4"
          >
            ← Înapoi
          </Link>

          <h1 className="mt-6 text-5xl font-extrabold text-white">amvenit.ro</h1>
          <p className="mt-3 text-white/80">Comenzi active</p>
        </div>

        {!isLoggedIn && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/90">
            <div className="font-extrabold">Fără cont vezi doar sumarul.</div>
            <div className="mt-1 text-sm text-white/80">
              Pentru Chat / Acceptă / Sună trebuie să te conectezi.
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href={loginHref}
                className="flex-1 text-center rounded-full border border-orange-400 bg-transparent px-6 py-3 font-extrabold text-orange-300 hover:bg-white/10"
              >
                Conectare
              </Link>
              <Link
                href={registerHref}
                className="flex-1 text-center rounded-full bg-orange-600 px-6 py-3 font-extrabold text-white hover:bg-orange-700"
              >
                Înregistrare
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8">
          {(authLoading || loading) && (
            <div className="text-center text-white/80 font-semibold">
              Se încarcă...
            </div>
          )}

          {err && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
              {err}
              <div className="mt-2 text-sm font-normal">
                Dacă vezi mesajul cu RLS (policy), înseamnă că trebuie setate
                policy-urile în Supabase (pasul de SQL).
              </div>
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="mt-6 text-center text-white/75">
              Momentan nu sunt comenzi active.
            </div>
          )}

          <div className="mt-8 space-y-6">
            {rows.map((o) => {
              const name = firstPart(o.who_where);
              const addr = secondPart(o.who_where);

              const displayName = !isLoggedIn
                ? name
                  ? `${name.split(" ")[0]}…`
                  : "Client…"
                : name;

              const displayAddr = !isLoggedIn
                ? addr
                  ? `${addr.split(",")[0]}…`
                  : "Zonă…"
                : addr;

              const displayPhone = !isLoggedIn ? maskPhone(o.phone) : o.phone ?? "";

              return (
                <div
                  key={o.id}
                  className="rounded-3xl bg-white/85 backdrop-blur border border-black/5 shadow-xl p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xl font-extrabold text-slate-900 truncate">
                        {displayName} {displayAddr ? `• ${displayAddr}` : ""}
                      </div>

                      <div className="mt-2 text-slate-800 font-semibold">
                        {o.what}
                        {o.urgent ? (
                          <span className="ml-2 inline-block rounded-full bg-orange-600 text-white px-3 py-1 text-xs font-extrabold">
                            URGENT
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 text-sm text-slate-600">
                        {new Date(o.created_at).toLocaleString("ro-RO")}
                      </div>

                      <div className="mt-2 text-sm text-slate-700">
                        Telefon:{" "}
                        <span className="font-bold">{displayPhone}</span>
                      </div>
                    </div>

                    {/* badge */}
                    <div className="shrink-0">
                      <span className="inline-block rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-extrabold">
                        COMANDĂ ACTIVĂ
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <button
                      disabled={!isLoggedIn}
                      className={`rounded-full px-4 py-3 font-extrabold ${
                        !isLoggedIn
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      }`}
                      onClick={() => {
                        if (!isLoggedIn) return;
                        alert("Chat-ul îl activăm după pasul de thread + acceptare.");
                      }}
                    >
                      Chat
                    </button>

                    <button
                      disabled={!canAccept}
                      className={`rounded-full px-4 py-3 font-extrabold ${
                        !canAccept
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                      onClick={() => acceptOrder(o.id)}
                    >
                      Acceptă
                    </button>

                    <button
                      disabled={!isLoggedIn}
                      className={`rounded-full px-4 py-3 font-extrabold ${
                        !isLoggedIn
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      }`}
                      onClick={() => {
                        if (!isLoggedIn) return;
                        alert("Sună: îl activăm după acceptare (tel:).");
                      }}
                    >
                      Sună
                    </button>
                  </div>

                  {!isLoggedIn && (
                    <div className="mt-4 text-center text-sm text-slate-700 font-semibold">
                      Conectează-te ca să poți accepta / suna / chat.
                    </div>
                  )}

                  {isLoggedIn && role !== "courier" && (
                    <div className="mt-4 text-center text-sm text-slate-700 font-semibold">
                      “Acceptă” este disponibil doar pentru livratori.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}