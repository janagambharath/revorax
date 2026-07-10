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

// ─── Dead Letter Queue ───────────────────────────────────────────────────────
const deadLetterQueue = new Queue('dead-letter', { connection });

async function sendToDeadLetter(workerName: string, jobId: string | undefined, data: any, error: string) {
  await deadLetterQueue.add('failed-job', {
    originalWorker: workerName,
    originalJobId: jobId,
    originalData: data,
    error,
    failedAt: new Date().toISOString(),
  });
  console.error(`💀 [DeadLetter] Job from ${workerName} (${jobId}): ${error}`);
}

// ─── Idempotency Check ───────────────────────────────────────────────────────
async function wasMessageSentToday(orgId: string, contactId: string, channel: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.message.findFirst({
    where: {
      orgId,
      contactId,
      channel: channel as any,
      direction: 'OUTBOUND',
      sentAt: { gte: today },
    },
  });
  return !!existing;
}

// ─── Renewal Reminder Worker (GYM) ──────────────────────────────────────────
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

    // Idempotency: don't send if already messaged today
    if (await wasMessageSentToday(orgId, member.contactId, 'WHATSAPP')) {
      console.log(`[RenewalReminder] Already sent today for ${member.contact.name}, skipping`);
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
      business_name: member.org.name,
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

// ─── Follow-Up Worker (Universal) ────────────────────────────────────────────
const followUpWorker = new Worker(
  QUEUES.FOLLOW_UP,
  async (job) => {
    const { orgId, contactId, channel, body } = job.data;

    const contact = await prisma.contact.findFirst({ where: { id: contactId, orgId } });
    if (!contact) return;

    // Check unsubscribe and idempotency
    if (contact.unsubscribedAt) {
      console.log(`[FollowUp] Contact ${contact.name} has unsubscribed, skipping`);
      return;
    }

    if (await wasMessageSentToday(orgId, contactId, 'WHATSAPP')) {
      console.log(`[FollowUp] Already sent today for ${contact.name}, skipping`);
      return;
    }

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

// ─── Payment Reminder Worker ─────────────────────────────────────────────────
const paymentWorker = new Worker(
  QUEUES.PAYMENT_REMINDER,
  async (job) => {
    const { orgId, memberId } = job.data;

    const member = await prisma.member.findFirst({
      where: { id: memberId, orgId, deletedAt: null },
      include: { contact: true, org: true },
    });

    if (!member || !member.contact.phone) return;

    if (await wasMessageSentToday(orgId, member.contactId, 'WHATSAPP')) {
      console.log(`[PaymentReminder] Already sent today for ${member.contact.name}, skipping`);
      return;
    }

    const body = `Hi ${member.contact.name}, your payment of ${formatCurrency(Number(member.amount))} to ${member.org.name} is pending. Please clear it to avoid suspension. Contact us at ${member.org.phone || 'the business'}.`;

    const whatsapp = await getWhatsAppClient(orgId);
    await whatsapp.sendTextMessage({ to: member.contact.phone, body });
    await prisma.message.create({
      data: { orgId, contactId: member.contactId, channel: 'WHATSAPP', direction: 'OUTBOUND', body, status: 'SENT', sentAt: new Date() },
    });

    console.log(`✅ [PaymentReminder] Sent to ${member.contact.name}`);
  },
  { connection, concurrency: 5 },
);

// ─── Scheduled Check: GYM — Expiring Members ────────────────────────────────
async function checkExpiringMembers() {
  console.log('🔍 [GYM] Checking expiring members...');

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
      org: { businessType: 'GYM' },
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
      org: { businessType: 'GYM' },
    },
  });

  for (const m of members3Days) {
    await renewalQueue.add('renewal-reminder', { orgId: m.orgId, memberId: m.id, channel: 'WHATSAPP', daysUntilExpiry: 3 });
  }

  console.log(`✅ [GYM] Queued ${members7Days.length + members3Days.length} renewal reminders`);
}

// ─── Scheduled Check: CLINIC — Patient Recalls ──────────────────────────────
async function checkClinicRecalls() {
  console.log('🔍 [CLINIC] Checking patient recalls...');
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
        { lastRecallDate: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
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

  console.log(`✅ [CLINIC] Queued ${recallPatients.length} patient recalls`);
}

// ─── Scheduled Check: SALON — Rebookings ─────────────────────────────────────
async function checkSalonRebookings() {
  console.log('🔍 [SALON] Checking rebookings...');
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

  console.log(`✅ [SALON] Queued ${lapsedClients.length} rebookings`);
}

// ─── Scheduled Check: COACHING — Overdue Fees ────────────────────────────────
async function checkCoachingFees() {
  console.log('🔍 [COACHING] Checking overdue fees...');
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Find coaching members with overdue renewal (fee) dates
  const overdueFees = await prisma.member.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      renewalDate: { lte: now },
      followUpStatus: 'PENDING',
      org: { businessType: 'COACHING' },
    },
    include: { contact: true, org: true },
  });

  const paymentQueue = new Queue(QUEUES.PAYMENT_REMINDER, { connection });
  for (const m of overdueFees) {
    if (!m.contact.phone) continue;
    await paymentQueue.add('payment-reminder', { orgId: m.orgId, memberId: m.id });
  }

  console.log(`✅ [COACHING] Queued ${overdueFees.length} fee reminders`);
}

// ─── Scheduled Check: REAL ESTATE — Cold Leads ──────────────────────────────
async function checkRealEstateColdLeads() {
  console.log('🔍 [REAL_ESTATE] Checking cold leads...');
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Find real estate members (prospects) not contacted in 3+ days
  const coldLeads = await prisma.member.findMany({
    where: {
      deletedAt: null,
      status: { in: ['ACTIVE', 'TRIAL'] },
      followUpStatus: 'PENDING',
      org: { businessType: 'REAL_ESTATE' },
      OR: [
        { lastContactedAt: null },
        { lastContactedAt: { lte: threeDaysAgo } },
      ],
    },
    include: { contact: true, org: true },
  });

  const followUpQueue = new Queue(QUEUES.FOLLOW_UP, { connection });
  for (const m of coldLeads) {
    if (!m.contact.phone) continue;
    const template = await prisma.template.findFirst({
      where: { orgId: m.orgId, name: 'Real Estate Site Visit Follow-up', channel: 'WHATSAPP' },
    });
    const body = template
      ? template.body.replace(/{{name}}/g, m.contact.name).replace(/{{business_name}}/g, m.org.name)
      : `Hi ${m.contact.name}, would you like to schedule a site visit? Reply VISIT and we'll share available slots.`;

    await followUpQueue.add('follow-up', { orgId: m.orgId, contactId: m.contactId, channel: 'WHATSAPP', body });
  }

  console.log(`✅ [REAL_ESTATE] Queued ${coldLeads.length} lead reactivations`);
}

// ─── Scheduled Check: DENTAL — Recall Reminders ─────────────────────────────
async function checkDentalRecalls() {
  console.log('🔍 [DENTAL] Checking recall reminders...');
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Find dental members (patients) with renewalDate (recall) in next 7 days
  const recallsDue = await prisma.member.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      renewalDate: { gte: now, lte: sevenDaysFromNow },
      followUpStatus: 'PENDING',
      org: { businessType: 'DENTAL' },
    },
    include: { contact: true, org: true },
  });

  const followUpQueue = new Queue(QUEUES.FOLLOW_UP, { connection });
  for (const m of recallsDue) {
    if (!m.contact.phone) continue;
    const template = await prisma.template.findFirst({
      where: { orgId: m.orgId, name: 'Dental Recall Reminder', channel: 'WHATSAPP' },
    });
    const body = template
      ? template.body.replace(/{{name}}/g, m.contact.name).replace(/{{business_name}}/g, m.org.name)
      : `Hi ${m.contact.name}, you are due for a dental recall at ${m.org.name}. Reply BOOK to schedule.`;

    await followUpQueue.add('follow-up', { orgId: m.orgId, contactId: m.contactId, channel: 'WHATSAPP', body });
  }

  console.log(`✅ [DENTAL] Queued ${recallsDue.length} recall reminders`);
}

// ─── Scheduled Check: AGENCY — Proposal Follow-ups & Renewals ───────────────
async function checkAgencyFollowUps() {
  console.log('🔍 [AGENCY] Checking proposal follow-ups and renewals...');
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const fourteenDaysFromNow = new Date(now);
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  // Stalled proposals (no follow-up in 3+ days)
  const stalledProposals = await prisma.member.findMany({
    where: {
      deletedAt: null,
      status: 'TRIAL', // TRIAL = open proposal for agencies
      followUpStatus: 'PENDING',
      org: { businessType: 'AGENCY' },
      OR: [
        { lastContactedAt: null },
        { lastContactedAt: { lte: threeDaysAgo } },
      ],
    },
    include: { contact: true, org: true },
  });

  // Retainer renewals coming up
  const retainerRenewals = await prisma.member.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      renewalDate: { gte: now, lte: fourteenDaysFromNow },
      followUpStatus: 'PENDING',
      org: { businessType: 'AGENCY' },
    },
    include: { contact: true, org: true },
  });

  const followUpQueue = new Queue(QUEUES.FOLLOW_UP, { connection });

  for (const m of stalledProposals) {
    if (!m.contact.phone) continue;
    const template = await prisma.template.findFirst({
      where: { orgId: m.orgId, name: 'Agency Proposal Follow-up', channel: 'WHATSAPP' },
    });
    const body = template
      ? template.body.replace(/{{name}}/g, m.contact.name).replace(/{{business_name}}/g, m.org.name)
      : `Hi ${m.contact.name}, following up on the proposal from ${m.org.name}. Would you like to review next steps?`;

    await followUpQueue.add('follow-up', { orgId: m.orgId, contactId: m.contactId, channel: 'WHATSAPP', body });
  }

  for (const m of retainerRenewals) {
    if (!m.contact.phone) continue;
    const template = await prisma.template.findFirst({
      where: { orgId: m.orgId, name: 'Agency Renewal Reminder', channel: 'WHATSAPP' },
    });
    const body = template
      ? template.body.replace(/{{name}}/g, m.contact.name).replace(/{{business_name}}/g, m.org.name)
      : `Hi ${m.contact.name}, your engagement with ${m.org.name} is coming up for renewal. Would you like to discuss next steps?`;

    await followUpQueue.add('follow-up', { orgId: m.orgId, contactId: m.contactId, channel: 'WHATSAPP', body });
  }

  console.log(`✅ [AGENCY] Queued ${stalledProposals.length} proposal follow-ups + ${retainerRenewals.length} renewal reminders`);
}

// ─── Error handlers with Dead Letter Queue ───────────────────────────────────
[renewalWorker, followUpWorker, paymentWorker].forEach((worker) => {
  worker.on('failed', async (job, err) => {
    console.error(`❌ [${worker.name}] Job ${job?.id} failed:`, err.message);
    await sendToDeadLetter(worker.name, job?.id, job?.data, err.message);
  });
  worker.on('completed', (job) => {
    console.log(`✅ [${worker.name}] Job ${job.id} completed`);
  });
});

// ─── Run ALL niche schedulers ────────────────────────────────────────────────
const runAllSchedulers = async () => {
  try {
    await Promise.all([
      // Existing niches
      checkExpiringMembers(),
      checkClinicRecalls(),
      checkSalonRebookings(),
      // New niches
      checkCoachingFees(),
      checkRealEstateColdLeads(),
      checkDentalRecalls(),
      checkAgencyFollowUps(),
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

console.log('✅ All workers started — all niches active');
console.log(`  - ${QUEUES.RENEWAL_REMINDER} (GYM)`);
console.log(`  - ${QUEUES.FOLLOW_UP} (ALL NICHES)`);
console.log(`  - ${QUEUES.PAYMENT_REMINDER} (GYM, COACHING)`);
console.log(`  - scheduler (daily 6AM)`);
console.log(`  - dead-letter (failed job capture)`);
console.log(`  Niche schedulers: GYM, CLINIC, SALON, COACHING, REAL_ESTATE, DENTAL, AGENCY`);
