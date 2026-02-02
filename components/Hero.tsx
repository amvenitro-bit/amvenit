import Image from "next/image";
import Link from "next/link";

import AppStoreButton from "./AppStoreButton";
import PlayStoreButton from "./PlayStoreButton";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      {/* HEADER */}
      <div className="absolute left-8 top-16 hidden md:block">
  <Image
    src="/mascota.png"
    alt="Mascotă amvenit.ro"
    width={200}
    height={300}
    priority
    className="select-none pointer-events-none"
  />
</div>

      <div className="absolute top-6 right-6 flex gap-3">
        <button className="px-5 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 text-sm font-semibold">
          Conectare
        </button>
        <button className="px-5 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold">
          Înregistrare
        </button>
      </div>

      {/* CONTENT */}
      <div className="text-center max-w-2xl w-full">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
          Cum funcționează?
        </h2>

       <p className="text-lg md:text-2xl text-white/85 leading-relaxed mb-10">
  Plasezi comanda, cineva o acceptă și gata.
  <br />
  Deja este în drum spre tine.
</p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center mb-14 mt-20">
  {/* Plasează o comandă */}
  <Link
    href="/cerere"
    className="w-full sm:w-[320px] rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl
               flex items-center justify-center py-5 text-lg font-extrabold"
  >
    Plasează o comandă
  </Link>

  {/* Comenzi active */}
  <Link
    href="/comenzi"
    className="w-full sm:w-[320px] rounded-full bg-slate-700 hover:bg-slate-800 text-white shadow-xl
               flex flex-col items-center justify-center py-4"
  >
    <span className="text-lg font-extrabold">Comenzi active</span>
    <span className="text-sm font-medium text-white/70">
      (poți vedea fără cont)
    </span>
  </Link>
</div>
        <div className="mt-40 flex flex-col sm:flex-row items-center justify-center gap-20">
  <AppStoreButton />
  <PlayStoreButton />
</div>

        <p className="text-sm text-white/60">
          * Platformă de intermediere. Livratorii sunt responsabili de livrare.
        </p>
      </div>
    </section>
  );
}