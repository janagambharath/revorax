import { NextRequest, NextResponse } from "next/server";

/**
 * Demo request handler — captures lead info from the landing page CTA form.
 *
 * Sends a notification email via Resend (if configured) and stores the
 * submission. Falls back to logging if Resend isn't set up yet.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, company, phone, email } = body;

    // Validate required fields
    if (!name || !company || !phone || !email) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Log the submission (always — this is our backup)
    console.log(
      `[DEMO REQUEST] Name: ${name} | Company: ${company} | Phone: ${phone} | Email: ${email} | Time: ${new Date().toISOString()}`
    );

    // Send notification email via Resend if API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.NOTIFY_EMAIL || "hello@revorax.com";
    const fromEmail =
      process.env.FROM_EMAIL || "Revorax <notifications@revorax.com>";

    if (resendApiKey) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [notifyEmail],
            subject: `🔥 New Demo Request — ${company}`,
            html: `
              <div style="font-family: -apple-system, sans-serif; max-width: 500px;">
                <h2 style="color: #0F172A; margin-bottom: 24px;">New Demo Request</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Name</td>
                    <td style="padding: 8px 0; color: #0F172A; font-size: 14px; font-weight: 600;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Company</td>
                    <td style="padding: 8px 0; color: #0F172A; font-size: 14px; font-weight: 600;">${company}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Phone</td>
                    <td style="padding: 8px 0; color: #0F172A; font-size: 14px; font-weight: 600;">
                      <a href="tel:${phone}" style="color: #4F46E5;">${phone}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Email</td>
                    <td style="padding: 8px 0; color: #0F172A; font-size: 14px; font-weight: 600;">
                      <a href="mailto:${email}" style="color: #4F46E5;">${email}</a>
                    </td>
                  </tr>
                </table>
                <hr style="margin: 24px 0; border: none; border-top: 1px solid #E5E7EB;" />
                <p style="color: #94A3B8; font-size: 12px;">
                  Submitted at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
                </p>
              </div>
            `,
          }),
        });

        if (!resendResponse.ok) {
          console.error(
            "[RESEND ERROR]",
            await resendResponse.text()
          );
        }
      } catch (emailError) {
        console.error("[RESEND ERROR]", emailError);
        // Don't fail the request if email fails — we already logged it
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo request received",
    });
  } catch (error) {
    console.error("[DEMO REQUEST ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
