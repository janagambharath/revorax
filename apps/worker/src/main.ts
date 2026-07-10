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

async function getWhatsAppClient(orgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (org?.whatsappPhoneNumberId && org?.whatsappAccessToken) {
    return new WhatsAppClient({
      phoneNumberId: org.whatsappPhoneNumberId,
      accessToken: org.whatsappAccessToken,
    });
  }
  return new WhatsAppClient();
}

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

    const body = template.body.replace(/{{(\w+)}}/g, (_: string, key: string) => variables[key] || `{{${key}}}`);

    if (channel === 'WHATSAPP') {
      const whatsapp = await getWhatsAppClient(orgId);
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
      const whatsapp = await getWhatsAppClient(orgId);
      await whatsapp.sendTextMessage({ to: contact.phone, body });
      await prisma.message.create({
        data: {
          orgId,
          contactId,
          channel: 'WHATSAPP',
          direction: 'OUTBOUND',
          body,
          status: 'SENT',
          sentAt: new Date(),
        },
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

    const whatsapp = await getWhatsAppClient(orgId);
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

async function checkClinicRecalls() {
  console.log('🔍 Checking clinic recalls...');
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const recallPatients = await prisma.patient.findMany({
    where: {
      deletedAt: null,
      status: 'RECALL',
      lastAppointmentDate: { lte: thirtyDaysAgo },
      OR: [
        { lastRecallDate: null },
        { lastRecallDate: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // not recalled in last 7 days
      ]
    },
    include: { contact: true, org: true },
  });

  const followUpQueue = new Queue(QUEUES.FOLLOW_UP, { connection });
  for (const p of recallPatients) {
    if (!p.contact.phone) continue;
    const template = await prisma.template.findFirst({
      where: { orgId: p.orgId, name: 'Clinic Recall Follow-up', channel: 'WHATSAPP' },
    });
    const body = template 
      ? template.body.replace(/{{name}}/g, p.contact.name).replace(/{{business_name}}/g, p.org.name)
      : `Hi ${p.contact.name}, you are due for a follow-up visit at ${p.org.name}. Reply BOOK to schedule.`;

    await followUpQueue.add('follow-up', { orgId: p.orgId, contactId: p.contactId, channel: 'WHATSAPP', body });
    await prisma.patient.update({
      where: { id: p.id },
      data: { lastRecallDate: new Date() },
    });
  }

  console.log(`✅ Queued ${recallPatients.length} clinic recalls`);
}

async function checkSalonRebookings() {
  console.log('🔍 Checking salon rebookings...');
  const now = new Date();
  const twentyOneDaysAgo = new Date();
  twentyOneDaysAgo.setDate(now.getDate() - 21);

  const lapsedClients = await prisma.client.findMany({
    where: {
      deletedAt: null,
      status: 'LAPSED',
      lastVisitDate: { lte: twentyOneDaysAgo },
    },
    include: { contact: true, org: true },
  });

  const followUpQueue = new Queue(QUEUES.FOLLOW_UP, { connection });
  for (const c of lapsedClients) {
    if (!c.contact.phone) continue;
    const template = await prisma.template.findFirst({
      where: { orgId: c.orgId, name: 'Salon Rebooking Reminder', channel: 'WHATSAPP' },
    });
    const body = template
      ? template.body.replace(/{{name}}/g, c.contact.name).replace(/{{business_name}}/g, c.org.name)
      : `Hi ${c.contact.name}, your next visit at ${c.org.name} is due. Reply BOOK to reserve a slot.`;

    await followUpQueue.add('follow-up', { orgId: c.orgId, contactId: c.contactId, channel: 'WHATSAPP', body });
  }

  console.log(`✅ Queued ${lapsedClients.length} salon rebookings`);
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

// ─── Run scheduler on startup and then via BullMQ repeatable job ──────────────
const runAllSchedulers = async () => {
  try {
    await Promise.all([
      checkExpiringMembers(),
      checkClinicRecalls(),
      checkSalonRebookings(),
    ]);
  } catch (err) {
    console.error('Failed running schedulers:', err);
  }
};

runAllSchedulers();

const schedulerQueue = new Queue('scheduler', { connection });
schedulerQueue.add('check-expiring', {}, {
  repeat: { pattern: '0 6 * * *' }, // 6 AM daily
}).catch(console.error);

const schedulerWorker = new Worker('scheduler', async (_job) => {
  if (_job.name === 'check-expiring') {
    await runAllSchedulers();
  }
}, { connection });

schedulerWorker.on('failed', (_job, err) => {
  console.error(`❌ [Scheduler] Job failed:`, err.message);
});

console.log('✅ All workers started');
console.log(`  - ${QUEUES.RENEWAL_REMINDER}`);
console.log(`  - ${QUEUES.FOLLOW_UP}`);
console.log(`  - ${QUEUES.PAYMENT_REMINDER}`);
console.log(`  - scheduler`);
