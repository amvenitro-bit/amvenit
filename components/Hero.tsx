"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

import AppStoreButton from "./AppStoreButton";
import PlayStoreButton from "./PlayStoreButton";

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userId, authLoading } = useAuth();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const pathname = usePathname();
  const next = encodeURIComponent(pathname || "/");
  const loginHref = `/conectare?next=${next}`;
  const registerHref = `/inregistrare?next=${next}`;

  // închide meniul dacă dai click în afară
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // când te loghezi, închide meniul mobil
  useEffect(() => {
    if (userId) setMenuOpen(false);
  }, [userId]);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      {/* MASCOTĂ – telefon (mai mică + sus stânga) */}
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

      {/* MASCOTĂ – desktop (mare) */}
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
          {authLoading ? null : userId ? (
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
          {authLoading ? null : userId ? (
            // când e logat: NU arătăm hamburger, doar buton portocaliu
            <Link
              href="/cont"
              className="px-5 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold"
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
                // se extinde spre stânga (către mascotă)
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
      <div className="text-center max-w-2xl w-full">
        <div className="mt-14 md:mt-0" />

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
            className="w-full sm:w-[320px] rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl flex items-center justify-center py-5 text-lg font-extrabold"
          >
            Plasează o comandă
          </Link>

          <Link
            href="/comenzi"
            className="w-full sm:w-[320px] rounded-full bg-slate-700 hover:bg-slate-800 text-white shadow-xl flex flex-col items-center justify-center py-4"
          >
            <span className="text-lg font-extrabold">Comenzi active</span>
            <span className="text-sm font-medium text-white/80">
              (poți vedea fără cont)
            </span>
          </Link>
        </div>

        <div className="mt-20 md:mt-24" />

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