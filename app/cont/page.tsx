"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function ContPage() {
  const router = useRouter();
  const { loading, userId, email, profile, role, signOut, refreshProfile } = useAuth();

  useEffect(() => {
    if (!loading && !userId) router.replace("/conectare?next=/cont");
  }, [loading, userId, router]);

  useEffect(() => {
    if (userId) refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-slate-700 font-semibold">Se încarcă...</div>
      </main>
    );
  }

  if (!userId) return null;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-black/5 p-6 md:p-8">
        {/* Header cu Înapoi */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold text-slate-900">Contul meu</h1>

          <button
  type="button"
  onClick={() => router.push("/")}
  className="rounded-full border border-slate-300 bg-white px-5 py-2 font-extrabold text-slate-800 hover:bg-slate-50"
>
  Înapoi
</button>
        </div>

        <div className="mt-6 space-y-3 text-slate-800">
          <div>
            <span className="font-bold">Email:</span> {email ?? "-"}
          </div>
          <div>
            <span className="font-bold">Nume:</span> {profile?.full_name ?? "-"}
          </div>
          <div>
            <span className="font-bold">Telefon:</span> {profile?.phone ?? "-"}
          </div>
          <div>
            <span className="font-bold">Rol:</span> {role ?? "-"}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/comenzile-mele"
            className="flex-1 text-center rounded-full bg-orange-600 px-6 py-3 font-extrabold text-white hover:bg-orange-700"
          >
            Comenzile mele
          </Link>

          <button
            onClick={async () => {
              await signOut();
              router.replace("/");
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