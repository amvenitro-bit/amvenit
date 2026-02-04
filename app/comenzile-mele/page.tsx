"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type OrderRow = {
  id: string;
  what: string;
  who_where: string;
  phone: string;
  urgent: boolean;
  status: string;
  created_at: string;
};

export default function ComenzileMelePage() {
  const router = useRouter();
  const { authLoading, userId } = useAuth();

  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // dacă nu e logat → redirect la conectare
  useEffect(() => {
    if (!authLoading && !userId) {
      router.replace("/conectare?next=/comenzile-mele");
    }
  }, [authLoading, userId, router]);

  // încarcă comenzile
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setErr(error.message);
      } else {
        setRows((data as OrderRow[]) || []);
      }

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // loading auth
  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-slate-700 font-semibold">Se verifică sesiunea…</div>
      </main>
    );
  }

  // încărcare comenzi
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-slate-700 font-semibold">
          Se încarcă comenzile…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Comenzile mele
          </h1>

          <Link
            href="/cont"
            className="rounded-full bg-orange-600 px-5 py-2 text-white font-bold hover:bg-orange-700"
          >
            Contul meu
          </Link>
        </div>

        {err && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
            {err}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="rounded-3xl bg-white shadow p-8 text-center text-slate-600">
            Nu ai încă nicio comandă.
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <div
                key={r.id}
                className="rounded-3xl bg-white shadow border border-black/5 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-extrabold text-slate-900">
                      {r.what}
                    </div>
                    <div className="mt-1 text-slate-700">
                      {r.who_where}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {new Date(r.created_at).toLocaleString("ro-RO")}
                    </div>
                  </div>

                  {r.urgent && (
                    <div className="shrink-0 rounded-full bg-orange-100 px-4 py-1 text-orange-700 font-extrabold">
                      Urgent
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-700">
                    Status:{" "}
                    <span className="font-extrabold">{r.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}