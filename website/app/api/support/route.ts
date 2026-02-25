import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's onboarding@resend.dev can only send to your Resend account email.
// Set SUPPORT_EMAIL in .env.local to that address for testing, or verify a domain
// and use a custom "from" to send to any address.
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "hafizahtasham07@gmail.com";

export async function POST(req: NextRequest) {
  let body: { type?: string; subject?: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, subject, email, message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "LogLife Support <onboarding@resend.dev>",
      to: SUPPORT_EMAIL,
      subject: `[${type ?? "General"}] ${subject ?? "No subject"}`,
      text: [
        `Type: ${type ?? "—"}`,
        `From: ${email ?? "—"}`,
        "",
        message,
      ].join("\n"),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
