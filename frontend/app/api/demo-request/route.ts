import { NextRequest, NextResponse } from "next/server";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_BODY_BYTES = 10_000;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(request: NextRequest) {
  const key = clientKey(request);
  const now = Date.now();
  const existing = requestCounts.get(key);
  if (!existing || existing.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) return true;
  existing.count += 1;
  return false;
}

function plainText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

/**
 * Public demo requests are intentionally delivered only when a configured,
 * verified Resend path accepts them.  Never claim success while merely
 * printing a prospect's contact information to ephemeral logs.
 */
export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  }
  if (isRateLimited(request)) {
    return NextResponse.json({ error: "Please wait before sending another request." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const name = plainText(body?.name, 120);
    const company = plainText(body?.company, 160);
    const phone = plainText(body?.phone, 32);
    const email = plainText(body?.email, 254).toLowerCase();

    if (!name || !company || !phone || !email) {
      return NextResponse.json({ error: "Name, company, phone, and email are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid work email." }, { status: 400 });
    }
    if (!/^[+()0-9 .-]{7,32}$/.test(phone)) {
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.NOTIFY_EMAIL;
    const fromEmail = process.env.FROM_EMAIL;
    if (!resendApiKey || !notifyEmail || !fromEmail) {
      console.error("Demo request delivery is not configured.");
      return NextResponse.json(
        { error: "Demo requests are not available right now. Please try again shortly." },
        { status: 503 },
      );
    }

    const safe = {
      name: escapeHtml(name),
      company: escapeHtml(company),
      phone: escapeHtml(phone),
      email: escapeHtml(email),
    };
    const submittedAt = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/New_York",
    }).format(new Date());
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [notifyEmail],
        subject: `New Revorax demo request — ${company}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:500px">
            <h2 style="color:#0f281e;margin-bottom:20px">New Revorax demo request</h2>
            <p><strong>Name:</strong> ${safe.name}</p>
            <p><strong>Company:</strong> ${safe.company}</p>
            <p><strong>Phone:</strong> <a href="tel:${safe.phone}" style="color:#4f46e5">${safe.phone}</a></p>
            <p><strong>Email:</strong> <a href="mailto:${safe.email}" style="color:#4f46e5">${safe.email}</a></p>
            <p style="color:#64748b;font-size:12px">Submitted ${escapeHtml(submittedAt)} ET</p>
          </div>`,
      }),
      cache: "no-store",
    });

    if (!resendResponse.ok) {
      console.error("Demo request delivery failed with Resend status", resendResponse.status);
      return NextResponse.json(
        { error: "We could not send that request. Please try again in a moment." },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, message: "Demo request received" });
  } catch {
    return NextResponse.json(
      { error: "We could not process that request. Please try again." },
      { status: 400 },
    );
  }
}
