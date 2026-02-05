"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

import AppStoreButton from "./AppStoreButton";
import PlayStoreButton from "./PlayStoreButton";

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userId, role, authLoading, refreshProfile } = useAuth();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const pathname = usePathname();
  const next = useMemo(() => encodeURIComponent(pathname || "/"), [pathname]);
  const loginHref = `/conectare?next=${next}`;
  const registerHref = `/inregistrare?next=${next}`;

  const isLoggedIn = !!userId;

  useEffect(() => {
    if (userId) refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const roleReady = !authLoading && (!userId || !!role);
  const isCourier = roleReady && isLoggedIn && role === "courier";

  // Toggle Disponibil/Indisponibil (UI only) – persistă în localStorage
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

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center px-6 overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      {/* ================== HEADER MOBILE (mereu) ================== */}
      <div
        className="
          absolute left-4 right-4 z-40 md:hidden
          pt-[calc(env(safe-area-inset-top)+0.75rem)]
        "
        style={{ top: 0 }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Mascotă mică */}
          <div className="shrink-0">
            <Image
              src="/mascota.png"
              alt="Mascotă amvenit.ro"
              width={52}
              height={52}
              priority
              className="select-none pointer-events-none mascot-pop"
            />
          </div>

          {/* Brand centrat (autofit) */}
          <div className="flex-1 min-w-0 text-center">
            <div
              className="
                text-white font-extrabold leading-none
                text-[clamp(14px,4.2vw,18px)]
                truncate
              "
              title="amvenit.ro"
            >
              amvenit.ro
            </div>
          </div>

          {/* Dreapta: Cont sau hamburger */}
          <div className="shrink-0 relative" ref={menuRef}>
            {authLoading ? null : isLoggedIn ? (
              <Link
                href="/cont"
                className="
                  inline-flex px-4 py-2 rounded-full
                  bg-orange-600 text-white hover:bg-orange-700
                  text-[clamp(12px,3.2vw,14px)] font-semibold
                  whitespace-nowrap
                "
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
                  <div className="absolute right-0 top-12 w-44 rounded-2xl bg-[#11172c] border border-white/10 shadow-xl p-2">
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
      </div>

      {/* ================== HEADER DESKTOP (full-width, pixel perfect) ================== */}
      <div className="absolute top-6 left-0 right-0 z-40 hidden md:block">
        {/* Brand absolut centrat */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0">
          <div className="text-white font-extrabold leading-none text-3xl select-none">
            amvenit.ro
          </div>
        </div>

        {/* Butoane LIPITE sus-dreapta */}
        <div className="absolute right-6 top-0 flex gap-3">
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
      </div>

      {/* Mascotă desktop */}
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

      {/* CONTENT (autofit: pe mobil lăsăm loc de header) */}
      <div className="w-full max-w-2xl text-center pt-28 md:pt-28">
        {!roleReady && isLoggedIn ? (
          <div className="mt-10 text-white/80 font-semibold">Se încarcă…</div>
        ) : isCourier ? (
          <>
            <div className="mt-10" />

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

            <div className="flex flex-col gap-4 items-center">
              <Link
                href="/comenzi"
                className="w-full sm:w-[420px] rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl flex items-center justify-center py-5 text-lg font-extrabold"
              >
                Comenzi postate de clienți
              </Link>

              <Link
                href="/comenzile-mele"
                className="w-full sm:w-[420px] rounded-full bg-slate-700 hover:bg-slate-800 text-white shadow-xl flex items-center justify-center py-5 text-lg font-extrabold"
              >
                Comenzile mele
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mt-10" />

            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
              Cum funcționează?
            </h2>

            <p className="text-lg md:text-2xl text-white/85 leading-relaxed">
              Plasezi comanda, cineva o acceptă și gata.
              <br />
              Deja este în drum spre tine.
            </p>

            <div className="mt-14 md:mt-16" />

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link
                href="/cerere"
                className="w-full sm:w-[320px] rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl flex items-center justify-center py-5 text-lg font-extrabold"
              >
                Plasează o comandă
              </Link>

              <Link
                href="/comenzi"
                className="w-full sm:w-[320px] rounded-full bg-slate-700 hover:bg-slate-800 text-white shadow-xl flex items-center justify-center py-5 text-lg font-extrabold"
              >
                Comenzi active
              </Link>
            </div>
          </>
        )}

        <div className="mt-28 md:mt-44" />
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