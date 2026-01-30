import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId || "").trim();

    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Missing orderId" }, { status: 400 });
    }

    const hasResend = !!process.env.RESEND_API_KEY;
    const hasAdminEmail = !!process.env.ADMIN_EMAIL;
    const hasAdminKey = !!process.env.ADMIN_KEY;
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasResend || !hasAdminEmail || !hasAdminKey || !hasServiceRole) {
      return NextResponse.json(
        { ok: false, error: "Missing env vars (RESEND_API_KEY / ADMIN_EMAIL / ADMIN_KEY / SUPABASE_SERVICE_ROLE_KEY)" },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Luăm detaliile comenzii ca să fie emailul util
    const { data: o, error } = await supabase
      .from("orders")
      .select("id, created_at, what, who_where, phone, urgent, phone_verified, verify_code, status")
      .eq("id", orderId)
      .single();

    if (error || !o) {
      return NextResponse.json({ ok: false, error: error?.message || "Order not found" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const adminKey = process.env.ADMIN_KEY!;

    const confirmLink =
      `${baseUrl}/api/admin/orders/verify-link?` +
      `key=${encodeURIComponent(adminKey)}&id=${encodeURIComponent(o.id)}`;

    const rejectLink =
      `${baseUrl}/api/admin/orders/reject-link?` +
      `key=${encodeURIComponent(adminKey)}&id=${encodeURIComponent(o.id)}`;

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Amvenit.ro <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL!,
      subject: `Cerere nouă: ${o.who_where || "Fără nume"}${o.urgent ? " (URGENT +10)" : ""}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.4">
          <h2>Cerere nouă pe Amvenit.ro</h2>
          <p><b>Nume/Localitate:</b> ${o.who_where || "-"}</p>
          <p><b>Cerere:</b> ${o.what || "-"}</p>
          <p><b>Telefon:</b> ${o.phone || "-"}</p>
          <p><b>Cod:</b> ${o.verify_code || "-"}</p>
          <p><b>Urgent:</b> ${o.urgent ? "DA (+10 lei)" : "NU"}</p>
          <p><b>Creat:</b> ${new Date(o.created_at).toLocaleString("ro-RO")}</p>
          <div style="display:flex; gap:10px; margin-top:14px">
            <a href="${confirmLink}" style="display:inline-block;padding:12px 16px;background:#16a34a;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;">
              Confirmă telefon (un click)
            </a>
            <a href="${rejectLink}" style="display:inline-block;padding:12px 16px;background:#e5e7eb;color:#111827;text-decoration:none;border-radius:10px;font-weight:700;">
              Respinge (șterge)
            </a>
          </div>
          <p style="margin-top:14px;color:#6b7280;font-size:12px">
            Notă: după confirmare, livratorii cu PIN vor putea folosi Chat/Sună.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}