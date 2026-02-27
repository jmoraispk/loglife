import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Resend's onboarding@resend.dev can only send to your Resend account email.
// Set SUPPORT_EMAIL in .env.local to that address for testing, or verify a domain
// and use a custom "from" to send to any address.
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "hafizahtasham07@gmail.com";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 },
    );
  }
  const resend = new Resend(apiKey);

  const contentType = req.headers.get("content-type") ?? "";
  let type: string | undefined;
  let subject: string | undefined;
  let email: string | undefined;
  let message: string | undefined;
  let attachment: { filename: string; content: Buffer } | null = null;

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    type = (formData.get("type") as string) ?? undefined;
    subject = (formData.get("subject") as string) ?? undefined;
    email = (formData.get("email") as string) ?? undefined;
    message = (formData.get("message") as string) ?? undefined;

    const file = formData.get("attachment");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json(
          { error: "Attachment must be under 5 MB" },
          { status: 400 },
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      attachment = {
        filename: file.name,
        content: Buffer.from(arrayBuffer),
      };
    }
  } else {
    try {
      const body = await req.json();
      type = body.type;
      subject = body.subject;
      email = body.email;
      message = body.message;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

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
      ...(attachment && { attachments: [attachment] }),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
