import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@revorax/database';
import { WhatsAppClient } from '@revorax/whatsapp';
import { formatDate, formatCurrency } from '@revorax/shared';

console.log('🚀 Revorax Worker starting...');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
}) as any;

const whatsapp = new WhatsAppClient();

// ─── Queue Names ─────────────────────────────────────────────────────────────
export const QUEUES = {
  RENEWAL_REMINDER: 'renewal-reminder',
  FOLLOW_UP: 'follow-up',
  CAMPAIGN: 'campaign',
  PAYMENT_REMINDER: 'payment-reminder',
  AI_ENRICHMENT: 'ai-enrichment',
} as const;

// ─── Renewal Reminder Worker ──────────────────────────────────────────────────
const renewalWorker = new Worker(
  QUEUES.RENEWAL_REMINDER,
  async (job) => {
    const { orgId, memberId, channel, daysUntilExpiry } = job.data;

    const member = await prisma.member.findFirst({
      where: { id: memberId, orgId, deletedAt: null },
      include: { contact: true, org: true },
    });

    if (!member || member.status === 'CANCELLED') {
      console.log(`[RenewalReminder] Skipping member ${memberId} - not found or cancelled`);
      return;
    }

    // Find the appropriate template
    const templateName = daysUntilExpiry <= 3 ? 'Renewal Reminder - 3 Days' : 'Renewal Reminder - 7 Days';
    const template = await prisma.template.findFirst({
      where: { orgId, name: templateName, channel: 'WHATSAPP' },
    });

    if (!template || !member.contact.phone) {
      console.log(`[RenewalReminder] No template or phone for member ${memberId}`);
      return;
    }

    const variables: Record<string, string> = {
      name: member.contact.name,
      gym_name: member.org.name,
      renewal_date: formatDate(member.renewalDate),
      phone: member.org.phone || '',
      amount: formatCurrency(Number(member.amount)),
    };

    const body = template.body.replace(/{{(\w+)}}/g, (_, key) => variables[key] || `{{${key}}}`);

    if (channel === 'WHATSAPP') {
      const result = await whatsapp.sendTextMessage({ to: member.contact.phone, body });
      await prisma.message.create({
        data: {
          orgId,
          contactId: member.contactId,
          channel: 'WHATSAPP',
          direction: 'OUTBOUND',
          body,
          status: 'SENT',
          externalId: result.messageId,
          sentAt: new Date(),
        },
      });
    }

    // Update member last contact
    await prisma.member.update({
      where: { id: memberId },
      data: { lastContactedAt: new Date(), followUpStatus: 'DONE' },
    });

    console.log(`✅ [RenewalReminder] Sent to ${member.contact.name} (${daysUntilExpiry} days)`);
  },
  { connection, concurrency: 5 },
);

// ─── Follow-Up Worker ─────────────────────────────────────────────────────────
const followUpWorker = new Worker(
  QUEUES.FOLLOW_UP,
  async (job) => {
    const { orgId, contactId, channel, body } = job.data;

    const contact = await prisma.contact.findFirst({ where: { id: contactId, orgId } });
    if (!contact) return;

    if (channel === 'WHATSAPP' && contact.phone) {
      await whatsapp.sendTextMessage({ to: contact.phone, body });
      await prisma.message.create({
        data: { orgId, contactId, channel: 'WHATSAPP', direction: 'OUTBOUND', body, status: 'SENT', sentAt: new Date() },
      });
    }

    console.log(`✅ [FollowUp] Sent to ${contact.name}`);
  },
  { connection, concurrency: 10 },
);

// ─── Payment Reminder Worker ──────────────────────────────────────────────────
const paymentWorker = new Worker(
  QUEUES.PAYMENT_REMINDER,
  async (job) => {
    const { orgId, memberId } = job.data;

    const member = await prisma.member.findFirst({
      where: { id: memberId, orgId, deletedAt: null },
      include: { contact: true, org: true },
    });

    if (!member || !member.contact.phone) return;

    const body = `Hi ${member.contact.name}, your payment of ${formatCurrency(Number(member.amount))} to ${member.org.name} is pending. Please clear it to avoid membership suspension. Contact us at ${member.org.phone || 'the gym'}.`;

    await whatsapp.sendTextMessage({ to: member.contact.phone, body });
    await prisma.message.create({
      data: { orgId, contactId: member.contactId, channel: 'WHATSAPP', direction: 'OUTBOUND', body, status: 'SENT', sentAt: new Date() },
    });

    console.log(`✅ [PaymentReminder] Sent to ${member.contact.name}`);
  },
  { connection, concurrency: 5 },
);

// ─── Scheduled Renewal Check (runs every day) ─────────────────────────────────
async function checkExpiringMembers() {
  console.log('🔍 Checking expiring members...');

  const renewalQueue = new Queue(QUEUES.RENEWAL_REMINDER, { connection });
  const now = new Date();

  // Find members expiring in 7 days
  const expiring7 = new Date(now);
  expiring7.setDate(expiring7.getDate() + 7);
  const expiring7Start = new Date(now);
  expiring7Start.setDate(expiring7Start.getDate() + 6);

  const members7Days = await prisma.member.findMany({
    where: {
      deletedAt: null,
      status: { in: ['ACTIVE', 'TRIAL'] },
      renewalDate: { gte: expiring7Start, lte: expiring7 },
      followUpStatus: 'PENDING',
    },
  });

  for (const m of members7Days) {
    await renewalQueue.add('renewal-reminder', { orgId: m.orgId, memberId: m.id, channel: 'WHATSAPP', daysUntilExpiry: 7 });
  }

  // Find members expiring in 3 days
  const expiring3 = new Date(now);
  expiring3.setDate(expiring3.getDate() + 3);
  const expiring3Start = new Date(now);
  expiring3Start.setDate(expiring3Start.getDate() + 2);

  const members3Days = await prisma.member.findMany({
    where: {
      deletedAt: null,
      status: { in: ['ACTIVE', 'TRIAL'] },
      renewalDate: { gte: expiring3Start, lte: expiring3 },
    },
  });

  for (const m of members3Days) {
    await renewalQueue.add('renewal-reminder', { orgId: m.orgId, memberId: m.id, channel: 'WHATSAPP', daysUntilExpiry: 3 });
  }

  console.log(`✅ Queued ${members7Days.length + members3Days.length} renewal reminders`);
}

// ─── Error handlers ───────────────────────────────────────────────────────────
[renewalWorker, followUpWorker, paymentWorker].forEach((worker) => {
  worker.on('failed', (job, err) => {
    console.error(`❌ [${worker.name}] Job ${job?.id} failed:`, err.message);
  });
  worker.on('completed', (job) => {
    console.log(`✅ [${worker.name}] Job ${job.id} completed`);
  });
});

// ─── Run scheduler on startup and then every 24 hours ─────────────────────────
checkExpiringMembers().catch(console.error);
setInterval(() => checkExpiringMembers().catch(console.error), 24 * 60 * 60 * 1000);

console.log('✅ All workers started');
console.log(`  - ${QUEUES.RENEWAL_REMINDER}`);
console.log(`  - ${QUEUES.FOLLOW_UP}`);
console.log(`  - ${QUEUES.PAYMENT_REMINDER}`);
