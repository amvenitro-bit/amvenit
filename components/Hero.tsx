import Image from "next/image";
import Link from "next/link";

import AppStoreButton from "./AppStoreButton";
import PlayStoreButton from "./PlayStoreButton";

export default function Hero() {
  return (
    <section className="relative flex items-center justify-center px-4 sm:px-6 overflow-hidden min-h-[100svh]">
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      {/* HEADER RIGHT (safe-area friendly) */}
      {/* LOGO (telefon + desktop) */}
<div className="absolute left-4 top-4 z-20 sm:hidden">
  <Link
    href="/"
    className="text-white font-extrabold tracking-tight text-xl"
  >
    amvenit.ro
  </Link>
</div>
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 sm:gap-3 z-20">
        <button className="px-4 sm:px-5 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 text-xs sm:text-sm font-semibold">
          Conectare
        </button>
        <button className="px-4 sm:px-5 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 text-xs sm:text-sm font-semibold">
          Înregistrare
        </button>
      </div>

      {/* MASCOTA LEFT (mic pe mobil / ascuns pe foarte mic) */}
      <div className="absolute left-3 top-3 sm:left-8 sm:top-6 z-20 hidden sm:block">
        <Image
          src="/mascota.png"
          alt="Mascotă amvenit.ro"
          width={200}
          height={360}
          priority
          className="select-none pointer-events-none"
        />
      </div>

      {/* CONTENT */}
      <div className="text-center w-full max-w-xl sm:max-w-2xl pt-16 sm:pt-20 pb-10 sm:pb-12">
        {/* TITLU */}
        <h2 className="font-extrabold text-white mb-4 leading-tight text-4xl sm:text-5xl md:text-6xl">
          Cum funcționează?
        </h2>

        {/* SUBTEXT */}
        <p className="text-white/85 leading-relaxed text-base sm:text-lg md:text-2xl mb-8 sm:mb-10 px-1">
          Plasezi comanda, cineva o acceptă și gata.
          <br />
          Deja este în drum spre tine.
        </p>

        {/* BUTOANE PRINCIPALE */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center mb-10 sm:mb-14">
          <Link
            href="/cerere"
            className="w-full sm:w-[320px] rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl
                       flex items-center justify-center py-4 sm:py-5 text-base sm:text-lg font-extrabold"
          >
            Plasează o comandă
          </Link>

          <Link
            href="/comenzi"
            className="w-full sm:w-[320px] rounded-full bg-slate-700 hover:bg-slate-800 text-white shadow-xl
                       flex flex-col items-center justify-center py-3.5 sm:py-4"
          >
            <span className="text-base sm:text-lg font-extrabold">Comenzi active</span>
            <span className="text-xs sm:text-sm font-medium text-white/70">
              (poți vedea fără cont)
            </span>
          </Link>
        </div>

        {/* APP BUTTONS (pe mobil stack / spacing normal) */}
        <div className="mt-10 sm:mt-14 flex flex-row items-center justify-center gap-3 sm:gap-6">
  <AppStoreButton />
  <PlayStoreButton />
</div>

        {/* DISCLAIMER */}
        <p className="mt-6 text-xs sm:text-sm text-white/60 px-2">
          * Platformă de intermediere. Livratorii sunt responsabili de livrare.
        </p>
      </div>
    </section>
  );
}