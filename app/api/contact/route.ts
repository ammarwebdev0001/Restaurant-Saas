import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminEmails } from "@/lib/auth/admin";
import { sendContactSubmissionEmail } from "@/lib/email/contact-submission";

const bodySchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const recipients = getAdminEmails();
  if (recipients.length === 0) {
    return NextResponse.json(
      {
        error:
          "Contact form is not configured. Set ADMIN_EMAIL or ADMIN_EMAILS in the environment.",
      },
      { status: 503 }
    );
  }

  const { firstName, email, company, message } = parsed.data;
  const sent = await sendContactSubmissionEmail({
    to: recipients,
    firstName,
    email: email.toLowerCase(),
    company,
    message,
  });

  if (!sent.ok) {
    console.error("[api/contact]", sent.error);
    return NextResponse.json({ error: sent.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
