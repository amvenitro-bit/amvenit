"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

function normalizePhone(raw: string) {
  let cleaned = raw.trim().replace(/[^\d+]/g, "");

  // accept RO formats: 07..., +40..., 0040...
  if (cleaned.startsWith("07")) cleaned = "+4" + cleaned; // 07xxxxxxxx -> +407xxxxxxxx
  if (cleaned.startsWith("0040")) cleaned = "+40" + cleaned.slice(4);
  if (cleaned.startsWith("40") && !cleaned.startsWith("+")) cleaned = "+" + cleaned;

  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return cleaned;
}

export default function CererePage() {
  const router = useRouter();
  const { userId, authLoading, profile, refreshProfile } = useAuth();

  const [what, setWhat] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [urgent, setUrgent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // popup succes
  const [successOpen, setSuccessOpen] = useState(false);

  // când userul e logat, asigură-te că avem profilul
  useEffect(() => {
    if (userId) refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // auto-complete din profile (doar dacă userul e logat)
  useEffect(() => {
    if (!userId) return;
    if (!profile) return;

    if (!name.trim() && profile.full_name) setName(profile.full_name);
    if (!phone.trim() && profile.phone) setPhone(profile.phone);
  }, [userId, profile, name, phone]);

  const profileNameOk = useMemo(
    () => !!(profile?.full_name && profile.full_name.trim()),
    [profile]
  );
  const profilePhoneOk = useMemo(
    () => !!(profile?.phone && profile.phone.trim()),
    [profile]
  );

  async function submit() {
    setErr(null);

    const w = what.trim();
    const a = address.trim();

    if (!w || !a) {
      setErr("Completează câmpurile obligatorii (Ce ai nevoie? + Adresă).");
      return;
    }

    setLoading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        throw new Error("Trebuie să fii logat ca să trimiți o cerere.");
      }

      // Nume + Telefon: prefer din profil; dacă lipsesc, ia din input și salvează în profil
      const effectiveName = (profile?.full_name ?? "").trim() || name.trim();
      const effectivePhoneRaw = (profile?.phone ?? "").trim() || phone.trim();

      if (!effectiveName || !effectivePhoneRaw) {
        throw new Error("Completează Nume și Telefon (se salvează în contul tău).");
      }

      const normalized = normalizePhone(effectivePhoneRaw);
      if (!normalized) {
        throw new Error(
          "Număr de telefon invalid. Accept: 07 / +40 / 0040 (minim 10 cifre)."
        );
      }

      // dacă profilul nu avea nume/telefon, le salvăm acum
      if (userId && (!profileNameOk || !profilePhoneOk)) {
        const { error: upErr } = await supabase
          .from("profiles")
          .update({
            full_name: effectiveName,
            phone: normalized,
          })
          .eq("id", userData.user.id);

        if (!upErr) await refreshProfile();
      }

      const who_where = `${effectiveName} • ${a}`;

      const { error } = await supabase.from("orders").insert([
        {
          client_id: userData.user.id,
          what: w,
          who_where,
          phone: normalized,
          urgent,
          status: "active",
        },
      ]);

      if (error) throw new Error(error.message);

      // reset doar câmpurile cererii (nu nume/telefon dacă e logat)
      setWhat("");
      setAddress("");
      setUrgent(false);

      // arată popup
      setSuccessOpen(true);
    } catch (e: any) {
      setErr(e?.message ?? "Eroare necunoscută.");
    } finally {
      setLoading(false);
    }
  }

  const showAuthHelpers = !!err && err.includes("Trebuie să fii logat");

  return (
    <main className="min-h-screen relative flex items-center justify-center px-5 py-16 overflow-hidden">
      {/* BACKGROUND identic cu Home (Hero) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>
{/* DREAPTA SUS – Acasă + Contul meu */}
<div className="absolute top-6 right-6 z-30 flex gap-3">
  <Link
    href="/"
    className="px-5 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 text-sm font-semibold"
  >
    Acasă
  </Link>

  {userId && (
    <Link
      href="/cont"
      className="px-5 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold"
    >
      Contul meu
    </Link>
  )}
</div>
      {/* POPUP SUCCES */}
      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSuccessOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-black/10 p-7">
            <div className="text-2xl font-extrabold text-slate-900">
              Comanda dumneavoastră a fost plasată cu succes!
            </div>
            <p className="mt-3 text-slate-700">
              Alege unde vrei să mergi mai departe.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setSuccessOpen(false);
                  router.push("/comenzile-mele");
                }}
                className="flex-1 rounded-full bg-orange-600 px-6 py-3 font-extrabold text-white hover:bg-orange-700"
              >
                Comenzile mele
              </button>

              <button
                onClick={() => {
                  setSuccessOpen(false);
                  router.push("/");
                }}
                className="flex-1 rounded-full border border-orange-600 bg-white px-6 py-3 font-extrabold text-orange-600 hover:bg-orange-50"
              >
                Acasă
              </button>
            </div>

            <button
              onClick={() => setSuccessOpen(false)}
              className="mt-6 w-full rounded-full bg-slate-100 px-6 py-3 font-extrabold text-slate-800 hover:bg-slate-200"
            >
              Închide
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          

          <h1 className="mt-5 text-5xl font-extrabold text-white">
            amvenit.ro
          </h1>
          <p className="mt-3 text-base md:text-lg text-white/80">
            Plasează o comandă în câteva secunde.
          </p>
        </div>

        <section className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-white/10 p-6 md:p-8">
          <div className="space-y-6">
            {/* 1) Ce ai nevoie? */}
            <div>
              <label className="block font-bold text-slate-900 text-lg">
                Ce ai nevoie?
              </label>
              <input
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                placeholder="ex: pâine, transport persoane, colet, medicamente etc."
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* 2) Adresă */}
            <div>
              <label className="block font-bold text-slate-900 text-lg">
                Adresă
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex: Str. Principală nr. 12, Baia de Aramă"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* 3) Nume */}
            <div>
              <label className="block font-bold text-slate-900 text-lg">
                Nume
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Laurențiu"
                readOnly={!!userId && profileNameOk}
                className={`mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  !!userId && profileNameOk ? "opacity-90" : ""
                }`}
              />
              {!!userId && profileNameOk && (
                <p className="mt-2 text-xs text-slate-500">
                  * Numele este luat din contul tău.
                </p>
              )}
            </div>

            {/* 4) Telefon */}
            <div>
              <label className="block font-bold text-slate-900 text-lg">
                Telefon
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: 07xxxxxxxx / +40xxxxxxxxx / 0040xxxxxxxxx"
                readOnly={!!userId && profilePhoneOk}
                className={`mt-2 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  !!userId && profilePhoneOk ? "opacity-90" : ""
                }`}
              />
              {!!userId && profilePhoneOk && (
                <p className="mt-2 text-xs text-slate-500">
                  * Telefonul este luat din contul tău.
                </p>
              )}
            </div>

            <label className="block rounded-2xl border border-orange-200 bg-orange-50/60 p-5 cursor-pointer">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <div>
                  <div className="font-extrabold text-orange-700 text-lg">
                    Urgent!
                  </div>
                  <div className="mt-2 text-slate-800">
                    <span className="text-4xl font-black text-orange-600">
                      +10 LEI
                    </span>{" "}
                    <span className="font-semibold">
                      la finalul cursei dacă vine în <b>30 minute maxim</b>.
                    </span>
                  </div>
                </div>
              </div>
            </label>

            {authLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 font-semibold">
                Se verifică sesiunea...
              </div>
            )}

            {err && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
                <p>{err}</p>

                {showAuthHelpers && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/conectare?next=/cerere"
                      className="flex-1 text-center rounded-full border border-orange-600 bg-white px-6 py-3 font-extrabold text-orange-600 hover:bg-orange-50"
                    >
                      Conectare
                    </Link>
                    <Link
                      href="/inregistrare?next=/cerere"
                      className="flex-1 text-center rounded-full bg-orange-600 px-6 py-3 font-extrabold text-white hover:bg-orange-700"
                    >
                      Înregistrare
                    </Link>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full rounded-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 px-8 py-5 text-lg font-extrabold text-white shadow-lg"
            >
              {loading ? "Se trimite..." : "Trimite comanda"}
            </button>

            <p className="text-center text-xs text-slate-500 pt-2">
              * Platformă de intermediere. Livratorii sunt responsabili de
              livrare.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}