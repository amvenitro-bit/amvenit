"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  what: string | null;
  who_where: string | null;
  urgent: boolean | null;
  client_id: string | null;
  courier_id: string | null;
};

export default function ComenzileMelePage() {
  const router = useRouter();
  const { loading, userId, role } = useAuth();

  const [rows, setRows] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const title = useMemo(() => {
    if (role === "courier") return "Comenzile mele (livrator)";
    return "Comenzile mele (client)";
  }, [role]);

  useEffect(() => {
    if (!loading && !userId) router.replace("/conectare?next=/comenzile-mele");
  }, [loading, userId, router]);

  useEffect(() => {
    if (!userId || loading) return;

    (async () => {
      setBusy(true);
      setErr(null);

      try {
        let q = supabase
          .from("orders")
          .select("id, created_at, status, what, who_where, urgent, client_id, courier_id")
          .order("created_at", { ascending: false })
          .limit(50);

        if (role === "courier") {
          q = q.eq("courier_id", userId);
        } else {
          q = q.eq("client_id", userId);
        }

        const { data, error } = await q;
        if (error) throw new Error(error.message);

        setRows((data ?? []) as OrderRow[]);
      } catch (e: any) {
        setErr(e?.message ?? "Eroare necunoscută");
      } finally {
        setBusy(false);
      }
    })();
  }, [userId, loading, role]);

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
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{title}</h1>
          <Link
            href="/cont"
            className="rounded-full border border-slate-300 bg-white px-5 py-2 font-extrabold text-slate-800 hover:bg-slate-50"
          >
            Înapoi la cont
          </Link>
        </div>

        {err && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 font-semibold">
            {err}
          </div>
        )}

        {busy ? (
          <div className="mt-6 text-slate-700 font-semibold">Se încarcă comenzile...</div>
        ) : rows.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
            N-ai comenzi încă.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {rows.map((o) => (
              <div
                key={o.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-extrabold text-slate-900">
                    {o.what || "Comandă"}
                    {o.urgent ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-xs font-extrabold text-white">
                        URGENT
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {new Date(o.created_at).toLocaleString("ro-RO")}
                  </div>
                </div>

                <div className="mt-2 text-slate-700">
                  <span className="font-bold">Detalii:</span> {o.who_where || "-"}
                </div>

                <div className="mt-2 text-slate-700">
                  <span className="font-bold">Status:</span> {o.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}