import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

/** Normalizează la format +407xxxxxxxx (doar pentru mobil RO) */
function normalizeRoMobile(raw: string) {
  let d = (raw || "").trim().replace(/[^\d]/g, ""); // doar cifre

  // 00407xxxxxxxx -> 07xxxxxxxx
  if (d.startsWith("0040")) d = "0" + d.slice(4);

  // 407xxxxxxxx -> 07xxxxxxxx
  if (d.startsWith("40")) d = "0" + d.slice(2);

  // validăm strict mobil RO: 07 + 8 cifre
  if (!/^07\d{8}$/.test(d)) return { ok: false as const, normalized: "" };

  // salvăm consistent ca +407...
  const normalized = "+4" + d; // +407...
  return { ok: true as const, normalized };
}

export async function POST(req: Request) {
  console.log("COURIER REQUEST: POST START");

  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const phoneRaw = String(body?.phone ?? "").trim();
    const area = String(body?.area ?? "").trim();

    console.log("COURIER REQUEST: parsed body", { name, phoneRaw, area });

    if (!name || !phoneRaw) {
      return NextResponse.json(
        { ok: false, error: "Nume și telefon sunt obligatorii." },
        { status: 400 }
      );
    }

    // ✅ VALIDARE + NORMALIZARE
    const phoneCheck = normalizeRoMobile(phoneRaw);
    if (!phoneCheck.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Telefon invalid. Folosește format RO: 07xxxxxxxx sau +40/0040 (ex: 073xxxxxxx).",
        },
        { status: 400 }
      );
    }

    const phone = phoneCheck.normalized; // +407...

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnon);

    // 1) INSERT în DB
    console.log("COURIER REQUEST: inserting DB...", { name, phone, area });

    const { data, error } = await supabase
      .from("courier_requests")
      .insert([{ name, phone, area, status: "pending" }])
      .select("id, created_at, name, phone, area, status")
      .single();

    if (error) {
      console.error("COURIER REQUEST: DB ERROR", error);
      return NextResponse.json(
        { ok: false, error: "Eroare DB: " + error.message },
        { status: 500 }
      );
    }

    console.log("COURIER REQUEST: DB OK", data);

    // 2) EMAIL (fail-safe)
    let emailSent = false;
    let emailError: string | null = null;

    try {
      const resendKey = process.env.RESEND_API_KEY;
      const adminEmail = process.env.ADMIN_EMAIL;

      if (!resendKey) throw new Error("Lipsește RESEND_API_KEY din .env.local");
      if (!adminEmail) throw new Error("Lipsește ADMIN_EMAIL din .env.local");

      const resend = new Resend(resendKey);

      const adminKey = process.env.ADMIN_KEY || "";
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const adminLink = adminKey
        ? `${baseUrl}/admin/livratori?key=${encodeURIComponent(adminKey)}`
        : `${baseUrl}/admin/livratori`;

      await resend.emails.send({
        from: "Amvenit.ro <onboarding@resend.dev>",
        to: adminEmail,
        subject: `Cerere nouă livrator: ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height:1.4">
            <h2>📩 Cerere nouă: Devino livrator</h2>
            <p><b>Nume:</b> ${name}</p>
            <p><b>Telefon:</b> ${phone}</p>
            <p><b>Zonă:</b> ${area || "-"}</p>
            <p>
              <a href="${adminLink}" style="display:inline-block;padding:10px 14px;background:#16a34a;color:#fff;text-decoration:none;border-radius:10px;">
                Deschide Admin (Aprobă / Respinge)
              </a>
            </p>
          </div>
        `,
      });

      emailSent = true;
      console.log("COURIER REQUEST: email OK");
    } catch (e: any) {
      emailError = e?.message || "Eroare necunoscută la email.";
      console.error("COURIER REQUEST: EMAIL ERROR", e);
    }

    return NextResponse.json({ ok: true, request: data, emailSent, emailError });
  } catch (e: any) {
    console.error("COURIER REQUEST: FATAL ERROR", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Eroare necunoscută." },
      { status: 500 }
    );
  }
}