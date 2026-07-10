import { PrismaClient, BusinessType, UserRole, Plan, MemberStatus, MembershipType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Revorax database...');

  // Create demo gym organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-gym' },
    update: {},
    create: {
      name: 'FitZone Gym',
      slug: 'demo-gym',
      businessType: BusinessType.GYM,
      phone: '+919999999999',
      email: 'admin@fitzone.com',
      city: 'Mumbai',
      plan: Plan.GROWTH,
    },
  });
  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // Create owner user
  const passwordHash = await bcrypt.hash('Password@123', 12);
  const owner = await prisma.user.upsert({
    where: { orgId_email: { orgId: org.id, email: 'owner@fitzone.com' } },
    update: {},
    create: {
      orgId: org.id,
      name: 'Raj Sharma',
      email: 'owner@fitzone.com',
      passwordHash,
      role: UserRole.OWNER,
    },
  });
  console.log(`✅ Owner created: ${owner.email}`);

  // Create staff user
  const staff = await prisma.user.upsert({
    where: { orgId_email: { orgId: org.id, email: 'staff@fitzone.com' } },
    update: {},
    create: {
      orgId: org.id,
      name: 'Priya Singh',
      email: 'staff@fitzone.com',
      passwordHash,
      role: UserRole.STAFF,
    },
  });
  console.log(`✅ Staff created: ${staff.email}`);

  // Create default templates
  const templates = [
    {
      name: 'Renewal Reminder - 7 Days',
      channel: 'WHATSAPP' as const,
      category: 'REMINDER' as const,
      body: 'Hi {{name}}, your membership at {{gym_name}} expires on {{renewal_date}}. Renew now to continue your fitness journey! Reply YES to renew or call us at {{phone}}.',
      variables: ['{{name}}', '{{gym_name}}', '{{renewal_date}}', '{{phone}}'],
    },
    {
      name: 'Renewal Reminder - 3 Days',
      channel: 'WHATSAPP' as const,
      category: 'REMINDER' as const,
      body: 'Hey {{name}}! ⚠️ Your membership expires in just 3 days ({{renewal_date}}). Don\'t let your progress stop — renew today! Contact us at {{phone}}.',
      variables: ['{{name}}', '{{renewal_date}}', '{{phone}}'],
    },
    {
      name: 'Expired Member Reactivation',
      channel: 'WHATSAPP' as const,
      category: 'FOLLOW_UP' as const,
      body: 'Hi {{name}}, we miss you at {{gym_name}}! 💪 Your membership expired on {{expiry_date}}. Come back and we\'ll offer you a special renewal rate. Reply to know more!',
      variables: ['{{name}}', '{{gym_name}}', '{{expiry_date}}'],
    },
    {
      name: 'Trial Welcome',
      channel: 'WHATSAPP' as const,
      category: 'WELCOME' as const,
      body: 'Welcome to {{gym_name}}, {{name}}! 🎉 Your trial starts today and runs until {{trial_end}}. We\'re excited to be part of your fitness journey. See you at the gym!',
      variables: ['{{gym_name}}', '{{name}}', '{{trial_end}}'],
    },
    {
      name: 'Payment Overdue',
      channel: 'WHATSAPP' as const,
      category: 'UTILITY' as const,
      body: 'Hi {{name}}, your membership payment of ₹{{amount}} is overdue. Please clear it to avoid suspension. Pay now or contact us at {{phone}}.',
      variables: ['{{name}}', '{{amount}}', '{{phone}}'],
    },
    {
      name: 'Trial Follow-up',
      channel: 'WHATSAPP' as const,
      category: 'FOLLOW_UP' as const,
      body: 'Hi {{name}}, how is your trial going at {{gym_name}}? 🏋️ Any questions or feedback? We\'d love to help you convert to a full membership at just ₹{{membership_price}}/month!',
      variables: ['{{name}}', '{{gym_name}}', '{{membership_price}}'],
    },
  ];

  for (const t of templates) {
    await prisma.template.upsert({
      where: { orgId_name_channel: { orgId: org.id, name: t.name, channel: t.channel } },
      update: {},
      create: { orgId: org.id, ...t },
    });
  }
  console.log(`✅ ${templates.length} templates created`);

  // Create sample contacts and members
  const memberData = [
    { name: 'Aarav Patel', phone: '+919876543201', status: MemberStatus.ACTIVE, type: MembershipType.MONTHLY, amount: 1500, daysOffset: 20 },
    { name: 'Kavya Reddy', phone: '+919876543202', status: MemberStatus.EXPIRED, type: MembershipType.QUARTERLY, amount: 4000, daysOffset: -5 },
    { name: 'Rahul Mehta', phone: '+919876543203', status: MemberStatus.TRIAL, type: MembershipType.MONTHLY, amount: 1500, daysOffset: 7 },
    { name: 'Sneha Kumar', phone: '+919876543204', status: MemberStatus.ACTIVE, type: MembershipType.ANNUAL, amount: 12000, daysOffset: 180 },
    { name: 'Arjun Nair', phone: '+919876543205', status: MemberStatus.EXPIRED, type: MembershipType.MONTHLY, amount: 1500, daysOffset: -15 },
    { name: 'Divya Joshi', phone: '+919876543206', status: MemberStatus.ACTIVE, type: MembershipType.MONTHLY, amount: 1800, daysOffset: 5 },
    { name: 'Vikram Gupta', phone: '+919876543207', status: MemberStatus.FROZEN, type: MembershipType.MONTHLY, amount: 1500, daysOffset: 10 },
    { name: 'Priya Iyer', phone: '+919876543208', status: MemberStatus.ACTIVE, type: MembershipType.QUARTERLY, amount: 4200, daysOffset: 60 },
  ];

  for (const m of memberData) {
    const contact = await prisma.contact.create({
      data: { orgId: org.id, name: m.name, phone: m.phone, source: 'WALK_IN' },
    });
    const now = new Date();
    const renewalDate = new Date(now);
    renewalDate.setDate(renewalDate.getDate() + m.daysOffset);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);

    await prisma.member.create({
      data: {
        orgId: org.id,
        contactId: contact.id,
        membershipType: m.type,
        status: m.status,
        startDate,
        renewalDate,
        amount: m.amount,
        paidAmount: m.status === MemberStatus.EXPIRED ? m.amount : m.amount,
      },
    });
  }
  console.log(`✅ ${memberData.length} members seeded`);

  // Create default renewal workflow
  await prisma.workflow.create({
    data: {
      orgId: org.id,
      name: 'Renewal Reminder Sequence',
      description: 'Automatically reminds members 7 days and 3 days before renewal',
      trigger: 'MEMBER_EXPIRY_7_DAYS',
      isActive: true,
      steps: [
        { day: -7, action: 'SEND_WHATSAPP', templateName: 'Renewal Reminder - 7 Days' },
        { day: -3, action: 'SEND_WHATSAPP', templateName: 'Renewal Reminder - 3 Days' },
        { day: 0, action: 'CREATE_TASK', title: 'Call expired member: {{name}}' },
      ],
    },
  });
  console.log(`✅ Default workflow created`);

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Login credentials:');
  console.log('   Owner: owner@fitzone.com / Password@123');
  console.log('   Staff: staff@fitzone.com / Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
