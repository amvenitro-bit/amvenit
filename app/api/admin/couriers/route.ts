import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function mustAdmin(key: string | null) {
  return key && process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    if (!mustAdmin(key)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("courier_requests")
      .select("id, created_at, name, phone, area, status")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, requests: data || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Eroare." }, { status: 500 });
  }
}