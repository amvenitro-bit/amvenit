import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function mustAdmin(key: string | null) {
  return key && process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;
}

function genPin() {
  // 6 cifre
  return String(Math.floor(100000 + Math.random() * 900000));
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

    // ia request-ul
    const { data: reqRow, error: rErr } = await supabase
      .from("courier_requests")
      .select("id, name, phone, status")
      .eq("id", id)
      .single();

    if (rErr) throw new Error(rErr.message);
    if (!reqRow) throw new Error("Cererea nu există.");

    // generează PIN + upsert în couriers (legat de phone)
    const pin = genPin();

    const { error: cErr } = await supabase
      .from("couriers")
      .upsert(
        [{ name: reqRow.name, phone: reqRow.phone, pin, active: true }],
        { onConflict: "phone" }
      );

    if (cErr) throw new Error(cErr.message);

    // marchează request aprobat
    const { error: uErr } = await supabase
      .from("courier_requests")
      .update({ status: "approved" })
      .eq("id", id);

    if (uErr) throw new Error(uErr.message);

    return NextResponse.json({ ok: true, pin });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Eroare." }, { status: 500 });
  }
}