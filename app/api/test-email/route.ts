import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      // merge fără verificare domeniu
      from: "Amvenit.ro <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL!,
      subject: "✅ Test email Amvenit.ro",
      html: `
        <h2>Email test reușit</h2>
        <p>Dacă vezi acest email, Resend e configurat corect.</p>
        <p><b>Amvenit.ro</b></p>
      `,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}