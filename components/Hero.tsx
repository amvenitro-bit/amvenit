import React from "react";
import Link from "next/link";

import AppStoreButton from "./AppStoreButton";
import PlayStoreButton from "./PlayStoreButton";

const Hero: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative flex items-center justify-center min-h-screen px-5"
    >
      {/* Background grid + fade */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 h-full w-full bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_55%_55%_at_50%_35%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
      </div>

      <div className="text-center w-full max-w-3xl">
        {/* BRAND */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
          amvenit.ro
        </h1>
        <p className="mt-4 text-white/80 text-lg md:text-xl">
          Servicii locale rapide.
        </p>

        {/* BUTOANE */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href="/cerere"
            className="w-full sm:w-[320px] text-center rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-5 text-lg shadow-lg"
          >
            Plasează o comandă
          </Link>

          <Link
            href="/comenzi"
            className="w-full sm:w-[320px] text-center rounded-full bg-slate-700 hover:bg-slate-800 text-white font-extrabold py-5 text-lg shadow-lg"
          >
            Comenzi active
          </Link>
        </div>

        {/* CUM FUNCTIONEAZA */}
        <div className="mt-16 space-y-3">
          <div className="text-2xl md:text-3xl font-extrabold text-white">
            Cum funcționează
          </div>
          <div className="text-white/85 text-lg md:text-xl leading-relaxed">
            Pui cererea, un livrator o acceptă și gata.
            <br />
            Deja este în drum spre tine.
          </div>
        </div>

        {/* BADGES */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
          <AppStoreButton />
          <PlayStoreButton />
        </div>

        {/* DISCLAIMER */}
        <div className="mt-8 text-sm text-white/70">
          * Platformă de intermediere. Livratorii sunt responsabili de livrare.
        </div>
      </div>
    </section>
  );
};

export default Hero;