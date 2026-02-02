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

      {/* MASCOTĂ – telefon (mică) */}
      <div className="absolute left-3 top-3 z-20 md:hidden">
        <Image
          src="/mascota.png"
          alt="Mascotă amvenit.ro"
          width={70}
          height={70}
          priority
          className="select-none pointer-events-none animate-[pop_700ms_ease-out_1]"
        />
      </div>

      {/* MASCOTĂ – desktop (mare) */}
      <div className="absolute left-9 top-16 z-20 hidden md:block">
        <Image
          src="/mascota.png"
          alt="Mascotă amvenit.ro"
          width={200}
          height={360}
          priority
          className="select-none pointer-events-none animate-[pop_700ms_ease-out_1]"
        />
      </div>

      {/* BUTOANE DREAPTA SUS */}
      <div className="absolute top-9 right-6 flex gap-3 z-20">
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

        <p className="text-lg md:text-2xl text-white/85 leading-relaxed">
          Plasezi comanda, cineva o acceptă și gata.
          <br />
          Deja este în drum spre tine.
        </p>

        {/* SPAȚIU MAI MARE (3 rânduri) ÎNTRE TEXT ȘI BUTOANE */}
        <div className="mt-16" />

        {/* BUTOANE PRINCIPALE */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
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

        {/* SPAȚIU MAI MARE (la fel ca jos) ÎNTRE BUTOANELE MARI ȘI STORE */}
        <div className="mt-16" />

        {/* STORE BUTTONS (orizontal pe mobil) */}
        <div className="flex flex-row items-center justify-center gap-3 sm:gap-6">
          <AppStoreButton />
          <PlayStoreButton />
        </div>

        <p className="mt-8 text-sm text-white/60">
          * Platformă de intermediere. Livratorii sunt responsabili de livrare.
        </p>
      </div>

      {/* KEYFRAMES bounce scurt (doar la intrare) */}
      <style jsx global>{`
        @keyframes pop {
          0% {
            transform: translateY(0) scale(0.92);
            opacity: 0;
          }
          45% {
            transform: translateY(-10px) scale(1.04);
            opacity: 1;
          }
          70% {
            transform: translateY(2px) scale(0.99);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </section>
  );
}