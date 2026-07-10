import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'Revorax <noreply@revorax.online>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@revorax.online';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  id: string;
  success: boolean;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: params.from || FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      replyTo: params.replyTo || REPLY_TO,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) throw new Error(error.message);
    return { id: data!.id, success: true };
  } catch (err) {
    console.error('[Email] Send failed:', err);
    throw err;
  }
}

// ─── HTML Email Templates ─────────────────────────────────────────────────────

export const baseEmailTemplate = (content: string, businessName: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Revorax</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f13; margin: 0; padding: 20px; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .card { background: #1a1a2e; border: 1px solid #2d2d4e; border-radius: 16px; padding: 40px; }
    .logo { font-size: 24px; font-weight: 800; color: #8b5cf6; letter-spacing: -0.5px; margin-bottom: 32px; }
    h1 { color: #f4f4f5; font-size: 24px; margin: 0 0 16px; }
    p { color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .footer { color: #52525b; font-size: 13px; margin-top: 32px; text-align: center; }
    .highlight { color: #a78bfa; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #2d2d4e; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">⚡ Revorax</div>
      ${content}
      <hr class="divider">
      <div class="footer">
        Sent by Revorax on behalf of ${businessName}<br>
        <a href="https://revorax.online" style="color: #8b5cf6; text-decoration: none;">revorax.online</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  welcome: (params: { name: string; orgName: string; loginUrl: string }) => ({
    subject: `Welcome to Revorax, ${params.name}! 🚀`,
    html: baseEmailTemplate(
      `<h1>Welcome, ${params.name}!</h1>
      <p>Your Revorax account for <span class="highlight">${params.orgName}</span> is ready. Start recovering revenue, managing members, and automating follow-ups today.</p>
      <a href="${params.loginUrl}" class="btn">Go to Dashboard →</a>
      <p>Your login: <span class="highlight">${params.loginUrl}</span></p>`,
      params.orgName,
    ),
  }),

  renewalReminder: (params: {
    memberName: string;
    gymName: string;
    renewalDate: string;
    amount: string;
    renewUrl?: string;
  }) => ({
    subject: `Your membership expires on ${params.renewalDate} — Renew now`,
    html: baseEmailTemplate(
      `<h1>Time to renew, ${params.memberName}!</h1>
      <p>Your membership at <span class="highlight">${params.gymName}</span> expires on <span class="highlight">${params.renewalDate}</span>.</p>
      <p>Renewal amount: <span class="highlight">${params.amount}</span></p>
      ${params.renewUrl ? `<a href="${params.renewUrl}" class="btn">Renew Membership →</a>` : ''}
      <p>Don't lose your progress — renew today and keep your streak going! 💪</p>`,
      params.gymName,
    ),
  }),

  paymentOverdue: (params: {
    memberName: string;
    gymName: string;
    amount: string;
    dueDate: string;
    contactPhone?: string;
  }) => ({
    subject: `Action required: Payment of ${params.amount} overdue`,
    html: baseEmailTemplate(
      `<h1>Payment reminder, ${params.memberName}</h1>
      <p>Your payment of <span class="highlight">${params.amount}</span> to <span class="highlight">${params.gymName}</span> was due on ${params.dueDate}.</p>
      <p>Please clear this to avoid membership suspension.</p>
      ${params.contactPhone ? `<p>Contact us: <span class="highlight">${params.contactPhone}</span></p>` : ''}`,
      params.gymName,
    ),
  }),

  inviteUser: (params: {
    inviteeName: string;
    orgName: string;
    inviterName: string;
    role: string;
    acceptUrl: string;
  }) => ({
    subject: `You've been invited to join ${params.orgName} on Revorax`,
    html: baseEmailTemplate(
      `<h1>You're invited!</h1>
      <p><span class="highlight">${params.inviterName}</span> has invited you to join <span class="highlight">${params.orgName}</span> as a <span class="highlight">${params.role}</span>.</p>
      <a href="${params.acceptUrl}" class="btn">Accept Invitation →</a>
      <p>This invite expires in 48 hours.</p>`,
      params.orgName,
    ),
  }),

  trialFollowUp: (params: {
    memberName: string;
    gymName: string;
    trialEndDate: string;
    price: string;
    contactPhone?: string;
  }) => ({
    subject: `How's your trial going, ${params.memberName}?`,
    html: baseEmailTemplate(
      `<h1>Loving your trial, ${params.memberName}?</h1>
      <p>Your trial at <span class="highlight">${params.gymName}</span> ends on <span class="highlight">${params.trialEndDate}</span>.</p>
      <p>Convert to a full membership for just <span class="highlight">${params.price}/month</span> and keep your momentum!</p>
      ${params.contactPhone ? `<p>Questions? Call us: <span class="highlight">${params.contactPhone}</span></p>` : ''}`,
      params.gymName,
    ),
  }),
};

export { resend };
