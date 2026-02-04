"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";

import AppStoreButton from "./AppStoreButton";
import PlayStoreButton from "./PlayStoreButton";

type Role = "client" | "courier" | null;

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userId, authLoading, refreshProfile } = useAuth();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const pathname = usePathname();
  const next = useMemo(() => encodeURIComponent(pathname || "/"), [pathname]);
  const loginHref = `/conectare?next=${next}`;
  const registerHref = `/inregistrare?next=${next}`;

  const isLoggedIn = !!userId;

  // 🔒 Rol “sigur” (citit direct din DB), ca să nu mai existe flicker pe Vercel
  const [roleDb, setRoleDb] = useState<Role>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // Toggle Disponibil/Indisponibil (UI only momentan) – persistă în localStorage
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("courier_available");
      if (saved === "0") setIsAvailable(false);
      if (saved === "1") setIsAvailable(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("courier_available", isAvailable ? "1" : "0");
    } catch {}
  }, [isAvailable]);

  // închide meniul dacă dai click în afară
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Trage profilul/rolul imediat când există userId (și forțează refresh în provider)
  useEffect(() => {
    if (!userId) {
      setRoleDb(null);
      return;
    }
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Citește rolul DIRECT din profiles (fix pentru Vercel / timing)
  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!userId) return;

      setRoleLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        const r = (data?.role || null) as Role;
        if (!cancelled) setRoleDb(r);
      } catch {
        // dacă pică query-ul, nu blocăm aplicația — tratăm ca “client”
        if (!cancelled) setRoleDb("client");
      } finally {
        if (!cancelled) setRoleLoading(false);
      }
    }

    if (userId) void loadRole();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const roleReady = !authLoading && (!isLoggedIn || (!roleLoading && roleDb !== null));
  const isCourier = roleReady && isLoggedIn && roleDb === "courier";

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      {/* MASCOTĂ – telefon */}
      <div className="absolute left-3 top-3 z-20 md:hidden">
        <Image
          src="/mascota.png"
          alt="Mascotă amvenit.ro"
          width={52}
          height={52}
          priority
          className="select-none pointer-events-none mascot-pop"
        />
      </div>

      {/* MASCOTĂ – desktop */}
      <div className="absolute left-8 top-16 z-20 hidden md:block">
        <Image
          src="/mascota.png"
          alt="Mascotă amvenit.ro"
          width={200}
          height={360}
          priority
          className="select-none pointer-events-none mascot-pop"
        />
      </div>

      {/* DREAPTA SUS */}
      <div className="absolute top-6 right-6 z-30">
        {/* Desktop */}
        <div className="hidden md:flex gap-3">
          {authLoading ? null : isLoggedIn ? (
            <Link
              href="/cont"
              className="px-5 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold"
            >
              Contul meu
            </Link>
          ) : (
            <>
              <Link
                href={loginHref}
                className="px-5 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 text-sm font-semibold"
              >
                Conectare
              </Link>

              <Link
                href={registerHref}
                className="px-5 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold"
              >
                Înregistrare
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden" ref={menuRef}>
          {authLoading ? null : isLoggedIn ? (
            <Link
              href="/cont"
              className="inline-flex px-5 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold"
            >
              Contul meu
            </Link>
          ) : (
            <>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                aria-label="Meniu"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="block w-5 h-0.5 bg-white/90" />
                  <span className="block w-5 h-0.5 bg-white/90" />
                  <span className="block w-5 h-0.5 bg-white/90" />
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-12 top-0 w-44 rounded-2xl bg-[#11172c] border border-white/10 shadow-xl p-2">
                  <Link
                    href={loginHref}
                    className="w-full block text-left px-4 py-2 rounded-xl text-white hover:bg-white/10 text-sm font-semibold"
                    onClick={() => setMenuOpen(false)}
                  >
                    Conectare
                  </Link>
                  <Link
                    href={registerHref}
                    className="w-full block text-left px-4 py-2 rounded-xl text-white hover:bg-white/10 text-sm font-semibold"
                    onClick={() => setMenuOpen(false)}
                  >
                    Înregistrare
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="w-full max-w-2xl text-center">
        {/* amvenit.ro SUS */}
        <div className="pt-4 md:pt-3" />
        <h1 className="text-5xl md:text-6xl font-extrabold text-white">
          amvenit.ro
        </h1>

        {/* blocăm UI-ul până știm sigur rolul (doar dacă e logat) */}
        {isLoggedIn && !roleReady ? (
          <div className="mt-6 text-white/80 font-semibold">Se încarcă…</div>
        ) : isCourier ? (
          <>
            {/* Courier UI */}
            <div className="mt-8" />

            {/* Toggle Disponibil/Indisponibil */}
            <div className="flex justify-center">
              <div className="w-full sm:w-[460px] rounded-3xl bg-white/10 border border-white/10 shadow-xl p-5">
                <div className="text-white font-extrabold text-lg">
                  {isAvailable ? "Disponibil pentru comenzi" : "Indisponibil"}
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsAvailable((v) => !v)}
                    aria-label="Disponibil pentru comenzi"
                    className={`relative w-28 h-12 rounded-full border transition ${
                      isAvailable
                        ? "bg-green-600 border-green-700/30"
                        : "bg-slate-500 border-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-10 w-10 rounded-full bg-white shadow-md transition-transform ${
                        isAvailable ? "translate-x-16" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-3 text-sm text-white/70">
                  * Când ești indisponibil, nu ar trebui să primești comenzi noi.
                </div>
              </div>
            </div>

            <div className="mt-6" />

            {/* Butoane una sub alta */}
            <div className="flex flex-col gap-4 items-center">
              <Link
                href="/comenzi"
                className="w-full sm:w-[420px] rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl
                           flex items-center justify-center py-5 text-lg font-extrabold"
              >
                Comenzi postate de clienți
              </Link>

              <Link
                href="/comenzile-mele"
                className="w-full sm:w-[420px] rounded-full bg-slate-700 hover:bg-slate-800 text-white shadow-xl
                           flex items-center justify-center py-5 text-lg font-extrabold"
              >
                Comenzile mele
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Client/anon */}
            <div className="mt-10" />

            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
              Cum funcționează?
            </h2>

            <p className="text-lg md:text-2xl text-white/85 leading-relaxed">
              Plasezi comanda, cineva o acceptă și gata.
              <br />
              Deja este în drum spre tine.
            </p>

            <div className="mt-16" />

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link
                href="/cerere"
                className="w-full sm:w-[320px] rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl
                           flex items-center justify-center py-5 text-lg font-extrabold"
              >
                Plasează o comandă
              </Link>

              <Link
                href="/comenzi"
                className="w-full sm:w-[320px] rounded-full bg-slate-700 hover:bg-slate-800 text-white shadow-xl
                           flex flex-col items-center justify-center py-4"
              >
                <span className="text-lg font-extrabold">Comenzi active</span>
                {!isLoggedIn && (
                  <span className="text-sm font-medium text-white/80">
                    (poți vedea fără cont)
                  </span>
                )}
              </Link>
            </div>
          </>
        )}

        {/* STORE BUTTONS mult mai jos */}
        <div className="mt-32 md:mt-44" />
        <div className="flex flex-row items-center justify-center gap-4 sm:gap-6">
          <div className="brightness-110 contrast-125">
            <AppStoreButton />
          </div>
          <div className="brightness-110 contrast-125">
            <PlayStoreButton />
          </div>
        </div>

        <p className="mt-8 text-sm text-white/70">
          * Platformă de intermediere. Livratorii sunt responsabili de livrare.
        </p>
      </div>
    </section>
  );
}