"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ContPage() {
  const router = useRouter();
  const { authLoading, userId, email, profile, role, signOut, refreshProfile } =
    useAuth();

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // IMPORTANT: când delogăm, nu mai lăsăm pagina să ne trimită în /conectare
    if (loggingOut) return;
    if (!authLoading && !userId) router.replace("/conectare?next=/cont");
  }, [authLoading, userId, router, loggingOut]);

  useEffect(() => {
    if (userId) refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const title = useMemo(() => {
    if (role === "courier") return "Contul meu de livrator";
    if (role === "client") return "Contul meu de client";
    return "Contul meu";
  }, [role]);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-slate-700 font-semibold">Se verifică sesiunea…</div>
      </main>
    );
  }

  if (!userId) return null;

  return (
    <main className="min-h-screen relative flex items-center justify-center px-6 py-10 overflow-hidden">
      {/* BACKGROUND identic cu Home */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_55%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      {/* Top-right home */}
      <div className="absolute top-6 right-6 z-30">
        <Link
          href="/"
          className="px-5 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 text-sm font-semibold"
        >
          Acasă
        </Link>
      </div>

      <div className="w-full max-w-2xl bg-white/85 backdrop-blur rounded-3xl shadow-xl border border-white/10 p-6 md:p-8">
        {/* TITLU CENTRAT */}
        <h1 className="text-center text-3xl font-extrabold text-slate-900">
          {title}
        </h1>

        <div className="mt-8 space-y-3 text-slate-800">
          <div>
            <span className="font-bold">Email:</span> {email ?? "-"}
          </div>
          <div>
            <span className="font-bold">Nume:</span> {profile?.full_name ?? "-"}
          </div>
          <div>
            <span className="font-bold">Telefon:</span> {profile?.phone ?? "-"}
          </div>
          {role === "courier" && (
  <div>
    <span className="font-bold">Nr. înmatriculare:</span>{" "}
    {profile?.vehicle_plate ?? "-"}
  </div>
)}

          {/* ROLUL DISPARA COMPLET */}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => alert("Editează contul – în curând.")}
            className="flex-1 rounded-full bg-orange-600 px-6 py-3 font-extrabold text-white hover:bg-orange-700"
          >
            Editează contul
          </button>

          <button
            onClick={async () => {
              setLoggingOut(true);

              // 1) curățăm sesiunea
              try {
                await signOut();
              } finally {
                // 2) hard redirect -> nu mai apucă să ne trimită /cont în /conectare
                window.location.href = "/";
              }
            }}
            className="flex-1 rounded-full border border-orange-600 bg-white px-6 py-3 font-extrabold text-orange-600 hover:bg-orange-50"
          >
            Delogare
          </button>
        </div>
      </div>
    </main>
  );
}