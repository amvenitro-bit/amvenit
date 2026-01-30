import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function mustAdmin(key: string | null) {
  return key && process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const key = String(body?.key ?? "");
    const id = String(body?.id ?? "");

    if (!mustAdmin(key)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ ok: false, error: "Lipsește id." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("courier_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Eroare." }, { status: 500 });
  }
}