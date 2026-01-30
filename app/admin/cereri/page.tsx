export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";

export default async function AdminCereriPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const sp = await searchParams;
  const key = sp?.key || "";

  return (
    <main className="min-h-screen bg-orange-50 p-6 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Admin • Cereri</h1>
          <Link href="/" className="text-orange-700 underline">
            Înapoi
          </Link>
        </div>

        {!key ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Lipsește cheia admin în URL. Deschide link-ul din email (cu ?key=...).
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-700">
              Pagina admin este OK (build-safe). Următorul pas este să încărcăm cererile prin API.
            </p>

            <a
              className="inline-block rounded-full bg-orange-600 hover:bg-orange-700 px-5 py-3 font-bold text-white"
              href={`/api/admin/orders?key=${encodeURIComponent(key)}`}
              target="_blank"
              rel="noreferrer"
            >
              Test: deschide lista din API
            </a>

            <p className="text-xs text-gray-500">
              Dacă API răspunde ok, trecem la UI complet (tabel + approve/reject) fără să stricăm build-ul.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}