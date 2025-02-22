// /src/app/api/send-email/route.ts
import { NextResponse } from "next/server";
import emailjs from "@emailjs/browser";

export async function POST(request: Request) {
  const { to, subject, html } = await request.json();

  // Validate environment variables
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.error("Missing EmailJS environment variables");
    return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 });
  }

  try {
    await emailjs.send(
      serviceId, // Now guaranteed to be a string
      templateId,
      {
        to_email: to,
        subject,
        message: html,
        from_name: "Bookwise",
      },
      {
        publicKey,
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("EmailJS error:", error);
    return NextResponse.json({ success: false, message: "Failed to send email" }, { status: 500 });
  }
}
