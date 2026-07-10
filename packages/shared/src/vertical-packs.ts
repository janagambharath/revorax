export type BusinessType =
  | 'GYM'
  | 'CLINIC'
  | 'SALON'
  | 'COACHING'
  | 'REAL_ESTATE'
  | 'DENTAL'
  | 'AGENCY'
  | 'OTHER';

export type VerticalTemplate = {
  name: string;
  channel: 'WHATSAPP' | 'EMAIL';
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'REMINDER' | 'FOLLOW_UP' | 'RENEWAL' | 'WELCOME' | 'CUSTOM';
  body: string;
  variables: string[];
};

export type VerticalWorkflow = {
  key: string;
  label: string;
  trigger: string;
  leak: string;
  steps: Array<{
    timing: string;
    action: string;
    templateName?: string;
  }>;
};

export type VerticalPack = {
  businessType: BusinessType;
  label: string;
  shortLabel: string;
  signupHint: string;
  iconLabel: string;
  accentColor: string;
  dashboardTitle: string;
  positioning: string;
  revenueGoal: string;
  targetNiche: string;
  painPoint: string;
  valueDelivered: string;
  primaryNavLabel: string;
  primaryEntity: string;
  primaryEntityPlural: string;
  customerLabel: string;
  customerPluralLabel: string;
  leadLabel: string;
  retentionObject: string;
  retentionDateLabel: string;
  amountLabel: string;
  activeLabel: string;
  trialLabel: string;
  inactiveLabel: string;
  expiringLabel: string;
  overdueLabel: string;
  reactivationLabel: string;
  recoveryListLabel: string;
  retentionMetricLabel: string;
  campaignAudienceLabel: string;
  campaignPlaceholder: string;
  aiQuickPrompts: Array<{ label: string; context: string }>;
  workflows: VerticalWorkflow[];
  templates: VerticalTemplate[];
  modules: string[];
  v1: string[];
  later: string[];
};

export type RetentionOption = {
  value: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'DAY_PASS' | 'CUSTOM';
  label: string;
};

export const BUSINESS_TYPE_ORDER: BusinessType[] = [
  'GYM',
  'CLINIC',
  'SALON',
  'COACHING',
  'REAL_ESTATE',
  'DENTAL',
  'AGENCY',
  'OTHER',
];

export const VERTICAL_PACKS: Record<BusinessType, VerticalPack> = {
  GYM: {
    businessType: 'GYM',
    label: 'Gym Revenue Recovery',
    shortLabel: 'Gym',
    signupHint: 'Recover renewals and convert trials',
    iconLabel: 'GY',
    accentColor: '#f97316',
    dashboardTitle: 'Gym Revenue OS',
    positioning: 'Recover expired memberships automatically.',
    revenueGoal: 'Recover expired memberships, convert trials, and prevent renewal leakage.',
    targetNiche: 'Gyms and fitness studios',
    painPoint: 'Expired memberships, weak trial follow-up, unpaid renewals, and staff forgetting reminders.',
    valueDelivered: 'More renewals, fewer lost members, faster payment follow-up, and clearer revenue recovery.',
    primaryNavLabel: 'Members',
    primaryEntity: 'member',
    primaryEntityPlural: 'members',
    customerLabel: 'member',
    customerPluralLabel: 'members',
    leadLabel: 'trial lead',
    retentionObject: 'membership',
    retentionDateLabel: 'renewal date',
    amountLabel: 'membership amount',
    activeLabel: 'Active members',
    trialLabel: 'on trial',
    inactiveLabel: 'expired',
    expiringLabel: 'Expiring this week',
    overdueLabel: 'Overdue renewals',
    reactivationLabel: 'Reactivation',
    recoveryListLabel: 'Renewal recovery list',
    retentionMetricLabel: 'renewal rate',
    campaignAudienceLabel: 'existing members',
    campaignPlaceholder: 'Hi {{name}}, your membership at {{business_name}} is due on {{renewal_date}}. Reply YES to renew.',
    aiQuickPrompts: [
      { label: 'Expired membership follow-up', context: 'Member has an expired membership and needs a reactivation message.' },
      { label: 'Trial conversion message', context: 'Trial member needs a friendly conversion message to become paid.' },
      { label: 'Payment reminder', context: 'Membership payment is overdue and needs a polite reminder.' },
    ],
    workflows: [
      {
        key: 'gym-renewal-recovery',
        label: 'Renewal recovery sequence',
        trigger: 'MEMBER_EXPIRY_7_DAYS',
        leak: 'Membership renewal leakage',
        steps: [
          { timing: '7 days before renewal', action: 'SEND_WHATSAPP', templateName: 'Gym Renewal Reminder - 7 Days' },
          { timing: '3 days before renewal', action: 'SEND_WHATSAPP', templateName: 'Gym Renewal Reminder - 3 Days' },
          { timing: 'On expiry', action: 'CREATE_TASK' },
        ],
      },
    ],
    templates: [
      {
        name: 'Gym Renewal Reminder - 7 Days',
        channel: 'WHATSAPP',
        category: 'REMINDER',
        body: 'Hi {{name}}, your membership at {{business_name}} renews on {{renewal_date}}. Reply YES to renew or contact us at {{phone}}.',
        variables: ['{{name}}', '{{business_name}}', '{{renewal_date}}', '{{phone}}'],
      },
      {
        name: 'Gym Expired Member Reactivation',
        channel: 'WHATSAPP',
        category: 'FOLLOW_UP',
        body: 'Hi {{name}}, we noticed your membership at {{business_name}} has expired. We can help you restart today. Reply RENEW for details.',
        variables: ['{{name}}', '{{business_name}}'],
      },
    ],
    modules: ['contacts', 'leads', 'members', 'payments', 'campaigns', 'ai', 'analytics'],
    v1: ['member list', 'renewal date', 'payment status', 'follow-up status', 'overdue list', 'reactivation list', 'renewal analytics'],
    later: ['access-control integrations', 'attendance-based churn prediction', 'advanced member segmentation'],
  },
  CLINIC: {
    businessType: 'CLINIC',
    label: 'Clinic Revenue Recovery',
    shortLabel: 'Clinic',
    signupHint: 'Reduce no-shows and recall patients',
    iconLabel: 'CL',
    accentColor: '#06b6d4',
    dashboardTitle: 'Clinic Revenue OS',
    positioning: 'Reduce no-shows and improve patient follow-up.',
    revenueGoal: 'Recover missed appointment revenue and increase patient recalls.',
    targetNiche: 'Clinics and outpatient practices',
    painPoint: 'Patients miss appointments, delay follow-ups, forget recalls, and do not return after treatment.',
    valueDelivered: 'Fewer no-shows, more completed appointments, stronger recall follow-up, and better patient retention.',
    primaryNavLabel: 'Patients',
    primaryEntity: 'patient',
    primaryEntityPlural: 'patients',
    customerLabel: 'patient',
    customerPluralLabel: 'patients',
    leadLabel: 'inquiry',
    retentionObject: 'appointment',
    retentionDateLabel: 'appointment or recall date',
    amountLabel: 'treatment value',
    activeLabel: 'Active patients',
    trialLabel: 'new inquiries',
    inactiveLabel: 'missed recalls',
    expiringLabel: 'Appointments this week',
    overdueLabel: 'Missed follow-ups',
    reactivationLabel: 'Recall list',
    recoveryListLabel: 'Appointment recovery list',
    retentionMetricLabel: 'show-up rate',
    campaignAudienceLabel: 'patients needing follow-up',
    campaignPlaceholder: 'Hi {{name}}, this is a reminder for your appointment at {{business_name}} on {{appointment_date}}. Reply CONFIRM.',
    aiQuickPrompts: [
      { label: 'Appointment confirmation', context: 'Patient has an upcoming appointment and needs a confirmation reminder.' },
      { label: 'No-show recovery', context: 'Patient missed an appointment and should be rebooked politely.' },
      { label: 'Recall reminder', context: 'Patient is due for a recall visit or follow-up check.' },
    ],
    workflows: [
      {
        key: 'clinic-no-show-reduction',
        label: 'Appointment confirmation sequence',
        trigger: 'APPOINTMENT_REMINDER',
        leak: 'No-show and missed recall revenue',
        steps: [
          { timing: '24 hours before appointment', action: 'SEND_WHATSAPP', templateName: 'Clinic Appointment Confirmation' },
          { timing: '2 hours before appointment', action: 'SEND_WHATSAPP', templateName: 'Clinic Appointment Reminder' },
          { timing: 'After missed appointment', action: 'CREATE_TASK' },
        ],
      },
    ],
    templates: [
      {
        name: 'Clinic Appointment Confirmation',
        channel: 'WHATSAPP',
        category: 'REMINDER',
        body: 'Hi {{name}}, please confirm your appointment at {{business_name}} on {{appointment_date}}. Reply CONFIRM or RESCHEDULE.',
        variables: ['{{name}}', '{{business_name}}', '{{appointment_date}}'],
      },
      {
        name: 'Clinic Recall Follow-up',
        channel: 'WHATSAPP',
        category: 'FOLLOW_UP',
        body: 'Hi {{name}}, you are due for a follow-up visit at {{business_name}}. Reply BOOK and we will help schedule it.',
        variables: ['{{name}}', '{{business_name}}'],
      },
    ],
    modules: ['contacts', 'leads', 'appointments', 'campaigns', 'ai', 'analytics'],
    v1: ['patient list', 'appointment reminders', 'no-show follow-up', 'recall reminders', 'treatment follow-up metric'],
    later: ['EHR integrations', 'doctor-wise schedules', 'insurance workflows'],
  },
  SALON: {
    businessType: 'SALON',
    label: 'Salon Revenue Recovery',
    shortLabel: 'Salon',
    signupHint: 'Increase repeat visits and packages',
    iconLabel: 'SA',
    accentColor: '#ec4899',
    dashboardTitle: 'Salon Revenue OS',
    positioning: 'Increase repeat visits and package renewals.',
    revenueGoal: 'Increase repeat bookings, package renewals, and loyalty-driven customer retention.',
    targetNiche: 'Salons, beauty studios, and spas',
    painPoint: 'Clients do not rebook, packages expire quietly, and loyalty follow-ups are inconsistent.',
    valueDelivered: 'More repeat visits, stronger package renewal, and timely loyalty messages.',
    primaryNavLabel: 'Clients',
    primaryEntity: 'client',
    primaryEntityPlural: 'clients',
    customerLabel: 'client',
    customerPluralLabel: 'clients',
    leadLabel: 'walk-in lead',
    retentionObject: 'package',
    retentionDateLabel: 'rebooking or package renewal date',
    amountLabel: 'package value',
    activeLabel: 'Active clients',
    trialLabel: 'new clients',
    inactiveLabel: 'lapsed clients',
    expiringLabel: 'Rebookings due this week',
    overdueLabel: 'Lapsed rebookings',
    reactivationLabel: 'Win-back list',
    recoveryListLabel: 'Repeat booking recovery list',
    retentionMetricLabel: 'repeat booking rate',
    campaignAudienceLabel: 'clients due for rebooking',
    campaignPlaceholder: 'Hi {{name}}, it is time for your next visit at {{business_name}}. Reply BOOK to reserve a slot.',
    aiQuickPrompts: [
      { label: 'Rebooking reminder', context: 'Salon client is due for a repeat visit and needs a rebooking message.' },
      { label: 'Package renewal', context: 'Client package is ending and should be renewed.' },
      { label: 'Birthday loyalty message', context: 'Client should receive a loyalty or birthday offer.' },
    ],
    workflows: [
      {
        key: 'salon-repeat-booking',
        label: 'Repeat booking sequence',
        trigger: 'MANUAL',
        leak: 'Missed repeat visit revenue',
        steps: [
          { timing: '21 days after visit', action: 'SEND_WHATSAPP', templateName: 'Salon Rebooking Reminder' },
          { timing: '30 days after visit', action: 'SEND_WHATSAPP', templateName: 'Salon Win-back Follow-up' },
          { timing: '45 days after visit', action: 'CREATE_TASK' },
        ],
      },
    ],
    templates: [
      {
        name: 'Salon Rebooking Reminder',
        channel: 'WHATSAPP',
        category: 'REMINDER',
        body: 'Hi {{name}}, your next visit at {{business_name}} is due. Reply BOOK and we will reserve a slot for you.',
        variables: ['{{name}}', '{{business_name}}'],
      },
      {
        name: 'Salon Package Renewal',
        channel: 'WHATSAPP',
        category: 'RENEWAL',
        body: 'Hi {{name}}, your package at {{business_name}} is almost complete. Renew now to keep your benefits active.',
        variables: ['{{name}}', '{{business_name}}'],
      },
    ],
    modules: ['contacts', 'appointments', 'campaigns', 'ai', 'analytics'],
    v1: ['client list', 'rebooking reminders', 'package renewal', 'birthday or loyalty campaign', 'repeat booking analytics'],
    later: ['POS integration', 'stylist performance', 'inventory-linked offers'],
  },
  COACHING: {
    businessType: 'COACHING',
    label: 'Coaching Revenue Recovery',
    shortLabel: 'Coaching',
    signupHint: 'Convert admissions and collect fees',
    iconLabel: 'CO',
    accentColor: '#8b5cf6',
    dashboardTitle: 'Coaching Revenue OS',
    positioning: 'Convert more admissions and collect fees on time.',
    revenueGoal: 'Convert more inquiries into admissions and reduce fee collection delays.',
    targetNiche: 'Coaching centers, tuition classes, and training institutes',
    painPoint: 'Admissions are not followed up, fee reminders are missed, and parent communication is manual.',
    valueDelivered: 'More admissions, timely fee collection, and consistent parent updates.',
    primaryNavLabel: 'Students',
    primaryEntity: 'student',
    primaryEntityPlural: 'students',
    customerLabel: 'student',
    customerPluralLabel: 'students',
    leadLabel: 'admission lead',
    retentionObject: 'fee cycle',
    retentionDateLabel: 'fee due date',
    amountLabel: 'fee amount',
    activeLabel: 'Active students',
    trialLabel: 'admission trials',
    inactiveLabel: 'inactive students',
    expiringLabel: 'Fees due this week',
    overdueLabel: 'Overdue fees',
    reactivationLabel: 'Admission follow-up',
    recoveryListLabel: 'Fee and admission recovery list',
    retentionMetricLabel: 'fee collection rate',
    campaignAudienceLabel: 'students or parents needing follow-up',
    campaignPlaceholder: 'Hi {{name}}, this is a reminder that fees for {{business_name}} are due on {{due_date}}. Reply PAID after payment.',
    aiQuickPrompts: [
      { label: 'Admission follow-up', context: 'Parent or student asked about admission and needs a conversion follow-up.' },
      { label: 'Fee reminder', context: 'Student fee is due or overdue and needs a polite reminder.' },
      { label: 'Batch reminder', context: 'Student needs a batch or class reminder.' },
    ],
    workflows: [
      {
        key: 'coaching-fee-recovery',
        label: 'Fee reminder sequence',
        trigger: 'PAYMENT_OVERDUE',
        leak: 'Delayed fee collection',
        steps: [
          { timing: '3 days before due date', action: 'SEND_WHATSAPP', templateName: 'Coaching Fee Reminder' },
          { timing: 'On due date', action: 'SEND_WHATSAPP', templateName: 'Coaching Fee Due Today' },
          { timing: '3 days after due date', action: 'CREATE_TASK' },
        ],
      },
    ],
    templates: [
      {
        name: 'Coaching Admission Follow-up',
        channel: 'WHATSAPP',
        category: 'FOLLOW_UP',
        body: 'Hi {{name}}, thanks for your interest in {{business_name}}. Would you like us to reserve an admission slot or schedule a counseling call?',
        variables: ['{{name}}', '{{business_name}}'],
      },
      {
        name: 'Coaching Fee Reminder',
        channel: 'WHATSAPP',
        category: 'REMINDER',
        body: 'Hi {{name}}, fees for {{business_name}} are due on {{due_date}}. Please complete payment to keep classes active.',
        variables: ['{{name}}', '{{business_name}}', '{{due_date}}'],
      },
    ],
    modules: ['contacts', 'leads', 'payments', 'campaigns', 'ai', 'analytics'],
    v1: ['student list', 'admission follow-up', 'fee reminders', 'parent communication', 'batch reminders'],
    later: ['LMS integrations', 'attendance analytics', 'exam result workflows'],
  },
  REAL_ESTATE: {
    businessType: 'REAL_ESTATE',
    label: 'Real Estate Revenue Recovery',
    shortLabel: 'Real Estate',
    signupHint: 'Qualify leads and book visits',
    iconLabel: 'RE',
    accentColor: '#10b981',
    dashboardTitle: 'Real Estate Revenue OS',
    positioning: 'Follow up on every lead and book more visits.',
    revenueGoal: 'Convert more property leads into qualified site visits and active deal opportunities.',
    targetNiche: 'Real estate brokers, builders, and property teams',
    painPoint: 'High-intent leads go cold because qualification, site visit booking, and follow-up are inconsistent.',
    valueDelivered: 'More site visits booked, fewer cold leads, stronger pipeline visibility, and faster reactivation.',
    primaryNavLabel: 'Prospects',
    primaryEntity: 'prospect',
    primaryEntityPlural: 'prospects',
    customerLabel: 'buyer',
    customerPluralLabel: 'buyers',
    leadLabel: 'property lead',
    retentionObject: 'site visit',
    retentionDateLabel: 'site visit date',
    amountLabel: 'deal value',
    activeLabel: 'Active prospects',
    trialLabel: 'new leads',
    inactiveLabel: 'cold leads',
    expiringLabel: 'Visits this week',
    overdueLabel: 'Unfollowed leads',
    reactivationLabel: 'Lead reactivation',
    recoveryListLabel: 'Lead-to-visit recovery list',
    retentionMetricLabel: 'visit booking rate',
    campaignAudienceLabel: 'property leads needing follow-up',
    campaignPlaceholder: 'Hi {{name}}, are you still interested in {{property_name}}? Reply VISIT and we will book a site visit.',
    aiQuickPrompts: [
      { label: 'Lead qualification', context: 'Real estate lead needs budget, location, and timeline qualification.' },
      { label: 'Site visit booking', context: 'Lead is interested and should be moved to a site visit.' },
      { label: 'Cold lead reactivation', context: 'Property lead has gone quiet and needs reactivation.' },
    ],
    workflows: [
      {
        key: 'real-estate-site-visit',
        label: 'Lead-to-visit sequence',
        trigger: 'LEAD_CREATED',
        leak: 'Unfollowed property leads',
        steps: [
          { timing: 'Immediately after lead capture', action: 'SEND_WHATSAPP', templateName: 'Real Estate Lead Qualification' },
          { timing: '24 hours after no response', action: 'SEND_WHATSAPP', templateName: 'Real Estate Site Visit Follow-up' },
          { timing: '72 hours after no response', action: 'CREATE_TASK' },
        ],
      },
    ],
    templates: [
      {
        name: 'Real Estate Lead Qualification',
        channel: 'WHATSAPP',
        category: 'FOLLOW_UP',
        body: 'Hi {{name}}, thanks for your interest in {{business_name}}. What budget, location, and move-in timeline should we plan around?',
        variables: ['{{name}}', '{{business_name}}'],
      },
      {
        name: 'Real Estate Site Visit Follow-up',
        channel: 'WHATSAPP',
        category: 'FOLLOW_UP',
        body: 'Hi {{name}}, would you like to schedule a site visit this week? Reply VISIT and we will share available slots.',
        variables: ['{{name}}'],
      },
    ],
    modules: ['contacts', 'leads', 'deals', 'appointments', 'campaigns', 'ai', 'analytics'],
    v1: ['lead qualification', 'site visit booking', 'pipeline tracking', 'follow-up sequencing', 'lead reactivation'],
    later: ['property inventory sync', 'broker assignment rules', 'WhatsApp catalog flows'],
  },
  DENTAL: {
    businessType: 'DENTAL',
    label: 'Dental Revenue Recovery',
    shortLabel: 'Dental',
    signupHint: 'Improve recall and treatment retention',
    iconLabel: 'DE',
    accentColor: '#3b82f6',
    dashboardTitle: 'Dental Revenue OS',
    positioning: 'Improve recall and treatment retention.',
    revenueGoal: 'Increase recall visits, treatment follow-through, and appointment confirmations.',
    targetNiche: 'Dental clinics and orthodontic practices',
    painPoint: 'Patients forget recall visits, delay treatment plans, and miss appointment confirmations.',
    valueDelivered: 'More recall bookings, fewer missed appointments, and stronger treatment acceptance.',
    primaryNavLabel: 'Patients',
    primaryEntity: 'patient',
    primaryEntityPlural: 'patients',
    customerLabel: 'patient',
    customerPluralLabel: 'patients',
    leadLabel: 'treatment inquiry',
    retentionObject: 'recall',
    retentionDateLabel: 'recall or treatment date',
    amountLabel: 'treatment value',
    activeLabel: 'Active patients',
    trialLabel: 'new patients',
    inactiveLabel: 'overdue recalls',
    expiringLabel: 'Recalls this week',
    overdueLabel: 'Missed recalls',
    reactivationLabel: 'Treatment follow-up',
    recoveryListLabel: 'Dental recall recovery list',
    retentionMetricLabel: 'recall completion rate',
    campaignAudienceLabel: 'patients due for recall',
    campaignPlaceholder: 'Hi {{name}}, you are due for a dental recall at {{business_name}}. Reply BOOK to schedule.',
    aiQuickPrompts: [
      { label: 'Recall reminder', context: 'Dental patient is due for a routine recall and cleaning.' },
      { label: 'Treatment plan follow-up', context: 'Patient received a treatment plan and has not booked yet.' },
      { label: 'Appointment confirmation', context: 'Patient has an upcoming dental appointment to confirm.' },
    ],
    workflows: [
      {
        key: 'dental-recall-recovery',
        label: 'Recall reminder sequence',
        trigger: 'APPOINTMENT_REMINDER',
        leak: 'Missed recall and treatment revenue',
        steps: [
          { timing: '7 days before recall', action: 'SEND_WHATSAPP', templateName: 'Dental Recall Reminder' },
          { timing: '1 day before appointment', action: 'SEND_WHATSAPP', templateName: 'Dental Appointment Confirmation' },
          { timing: 'After missed recall', action: 'CREATE_TASK' },
        ],
      },
    ],
    templates: [
      {
        name: 'Dental Recall Reminder',
        channel: 'WHATSAPP',
        category: 'REMINDER',
        body: 'Hi {{name}}, you are due for a dental recall at {{business_name}}. Reply BOOK and we will schedule your visit.',
        variables: ['{{name}}', '{{business_name}}'],
      },
      {
        name: 'Dental Treatment Follow-up',
        channel: 'WHATSAPP',
        category: 'FOLLOW_UP',
        body: 'Hi {{name}}, following up on your treatment plan at {{business_name}}. Would you like help booking the next step?',
        variables: ['{{name}}', '{{business_name}}'],
      },
    ],
    modules: ['contacts', 'appointments', 'campaigns', 'ai', 'analytics'],
    v1: ['patient list', 'recall reminders', 'appointment confirmation', 'treatment follow-up', 'retention analytics'],
    later: ['practice management integrations', 'chair utilization analytics', 'treatment plan financing'],
  },
  AGENCY: {
    businessType: 'AGENCY',
    label: 'Agency Revenue Recovery',
    shortLabel: 'Agency',
    signupHint: 'Track proposals and client renewals',
    iconLabel: 'AG',
    accentColor: '#f59e0b',
    dashboardTitle: 'Agency Revenue OS',
    positioning: 'Never lose a client follow-up again.',
    revenueGoal: 'Recover stalled proposals, retain clients, and improve renewal follow-up.',
    targetNiche: 'Marketing, design, consulting, and service agencies',
    painPoint: 'Proposals stall, client check-ins are missed, and renewals do not have an accountable follow-up system.',
    valueDelivered: 'More proposal wins, stronger client retention, and clearer renewal accountability.',
    primaryNavLabel: 'Clients',
    primaryEntity: 'client',
    primaryEntityPlural: 'clients',
    customerLabel: 'client',
    customerPluralLabel: 'clients',
    leadLabel: 'proposal lead',
    retentionObject: 'retainer',
    retentionDateLabel: 'renewal or proposal follow-up date',
    amountLabel: 'deal or retainer value',
    activeLabel: 'Active clients',
    trialLabel: 'open proposals',
    inactiveLabel: 'stalled accounts',
    expiringLabel: 'Renewals this week',
    overdueLabel: 'Stalled follow-ups',
    reactivationLabel: 'Proposal follow-up',
    recoveryListLabel: 'Proposal and renewal recovery list',
    retentionMetricLabel: 'proposal win rate',
    campaignAudienceLabel: 'prospects or clients needing follow-up',
    campaignPlaceholder: 'Hi {{name}}, following up on the proposal from {{business_name}}. Would you like to review next steps this week?',
    aiQuickPrompts: [
      { label: 'Proposal follow-up', context: 'Agency prospect has received a proposal and needs follow-up.' },
      { label: 'Client renewal reminder', context: 'Client retainer is due for renewal soon.' },
      { label: 'Client check-in', context: 'Client needs a proactive account check-in to improve retention.' },
    ],
    workflows: [
      {
        key: 'agency-proposal-recovery',
        label: 'Proposal recovery sequence',
        trigger: 'MANUAL',
        leak: 'Stalled proposal and renewal revenue',
        steps: [
          { timing: '2 days after proposal', action: 'SEND_EMAIL', templateName: 'Agency Proposal Follow-up' },
          { timing: '5 days after proposal', action: 'SEND_WHATSAPP', templateName: 'Agency Proposal WhatsApp Follow-up' },
          { timing: '7 days after proposal', action: 'CREATE_TASK' },
        ],
      },
    ],
    templates: [
      {
        name: 'Agency Proposal Follow-up',
        channel: 'EMAIL',
        category: 'FOLLOW_UP',
        body: 'Hi {{name}}, following up on the proposal from {{business_name}}. Are you available this week to review next steps?',
        variables: ['{{name}}', '{{business_name}}'],
      },
      {
        name: 'Agency Renewal Reminder',
        channel: 'WHATSAPP',
        category: 'RENEWAL',
        body: 'Hi {{name}}, your engagement with {{business_name}} is coming up for renewal. Would you like us to share the next-month plan?',
        variables: ['{{name}}', '{{business_name}}'],
      },
    ],
    modules: ['contacts', 'leads', 'deals', 'campaigns', 'ai', 'analytics'],
    v1: ['lead management', 'proposal follow-up', 'deal tracking', 'client communication', 'renewal reminders'],
    later: ['proposal e-signature integration', 'project management sync', 'client health scoring'],
  },
  OTHER: {
    businessType: 'OTHER',
    label: 'SMB Revenue Recovery',
    shortLabel: 'SMB',
    signupHint: 'Follow up, retain, and recover revenue',
    iconLabel: 'SM',
    accentColor: '#6b7280',
    dashboardTitle: 'Revenue OS',
    positioning: 'Recover lost revenue with better follow-up.',
    revenueGoal: 'Capture more leads, convert more customers, and retain repeat revenue.',
    targetNiche: 'Service businesses with leads, bookings, renewals, or repeat customers',
    painPoint: 'Follow-ups are inconsistent and revenue opportunities are not tracked.',
    valueDelivered: 'More timely follow-up, better retention, and clearer revenue accountability.',
    primaryNavLabel: 'Customers',
    primaryEntity: 'customer',
    primaryEntityPlural: 'customers',
    customerLabel: 'customer',
    customerPluralLabel: 'customers',
    leadLabel: 'lead',
    retentionObject: 'follow-up',
    retentionDateLabel: 'follow-up date',
    amountLabel: 'revenue value',
    activeLabel: 'Active customers',
    trialLabel: 'new leads',
    inactiveLabel: 'inactive customers',
    expiringLabel: 'Follow-ups this week',
    overdueLabel: 'Overdue follow-ups',
    reactivationLabel: 'Reactivation',
    recoveryListLabel: 'Revenue recovery list',
    retentionMetricLabel: 'retention rate',
    campaignAudienceLabel: 'customers needing follow-up',
    campaignPlaceholder: 'Hi {{name}}, following up from {{business_name}}. Would you like help with the next step?',
    aiQuickPrompts: [
      { label: 'General follow-up', context: 'Customer needs a useful follow-up message.' },
      { label: 'Lead conversion', context: 'Lead has shown interest and needs conversion follow-up.' },
      { label: 'Reactivation', context: 'Inactive customer should be re-engaged.' },
    ],
    workflows: [
      {
        key: 'smb-follow-up-recovery',
        label: 'Follow-up recovery sequence',
        trigger: 'MANUAL',
        leak: 'Missed follow-up revenue',
        steps: [
          { timing: 'After lead capture', action: 'SEND_WHATSAPP', templateName: 'SMB Follow-up' },
          { timing: '48 hours after no response', action: 'SEND_EMAIL', templateName: 'SMB Email Follow-up' },
          { timing: '72 hours after no response', action: 'CREATE_TASK' },
        ],
      },
    ],
    templates: [
      {
        name: 'SMB Follow-up',
        channel: 'WHATSAPP',
        category: 'FOLLOW_UP',
        body: 'Hi {{name}}, following up from {{business_name}}. Reply YES if you would like help with the next step.',
        variables: ['{{name}}', '{{business_name}}'],
      },
    ],
    modules: ['contacts', 'leads', 'campaigns', 'ai', 'analytics'],
    v1: ['contacts', 'lead follow-up', 'manual reminders', 'AI message drafts', 'basic revenue analytics'],
    later: ['industry-specific integrations after validation'],
  },
};

export const BUSINESS_TYPES: Record<BusinessType, { label: string; icon: string; color: string; hint: string }> = {
  GYM: { label: VERTICAL_PACKS.GYM.shortLabel, icon: VERTICAL_PACKS.GYM.iconLabel, color: VERTICAL_PACKS.GYM.accentColor, hint: VERTICAL_PACKS.GYM.signupHint },
  CLINIC: { label: VERTICAL_PACKS.CLINIC.shortLabel, icon: VERTICAL_PACKS.CLINIC.iconLabel, color: VERTICAL_PACKS.CLINIC.accentColor, hint: VERTICAL_PACKS.CLINIC.signupHint },
  SALON: { label: VERTICAL_PACKS.SALON.shortLabel, icon: VERTICAL_PACKS.SALON.iconLabel, color: VERTICAL_PACKS.SALON.accentColor, hint: VERTICAL_PACKS.SALON.signupHint },
  COACHING: { label: VERTICAL_PACKS.COACHING.shortLabel, icon: VERTICAL_PACKS.COACHING.iconLabel, color: VERTICAL_PACKS.COACHING.accentColor, hint: VERTICAL_PACKS.COACHING.signupHint },
  REAL_ESTATE: { label: VERTICAL_PACKS.REAL_ESTATE.shortLabel, icon: VERTICAL_PACKS.REAL_ESTATE.iconLabel, color: VERTICAL_PACKS.REAL_ESTATE.accentColor, hint: VERTICAL_PACKS.REAL_ESTATE.signupHint },
  DENTAL: { label: VERTICAL_PACKS.DENTAL.shortLabel, icon: VERTICAL_PACKS.DENTAL.iconLabel, color: VERTICAL_PACKS.DENTAL.accentColor, hint: VERTICAL_PACKS.DENTAL.signupHint },
  AGENCY: { label: VERTICAL_PACKS.AGENCY.shortLabel, icon: VERTICAL_PACKS.AGENCY.iconLabel, color: VERTICAL_PACKS.AGENCY.accentColor, hint: VERTICAL_PACKS.AGENCY.signupHint },
  OTHER: { label: VERTICAL_PACKS.OTHER.shortLabel, icon: VERTICAL_PACKS.OTHER.iconLabel, color: VERTICAL_PACKS.OTHER.accentColor, hint: VERTICAL_PACKS.OTHER.signupHint },
};

export const RETENTION_OPTIONS: Record<BusinessType, RetentionOption[]> = {
  GYM: [
    { value: 'MONTHLY', label: 'Monthly membership' },
    { value: 'QUARTERLY', label: 'Quarterly membership' },
    { value: 'HALF_YEARLY', label: 'Half-yearly membership' },
    { value: 'ANNUAL', label: 'Annual membership' },
    { value: 'DAY_PASS', label: 'Trial / day pass' },
    { value: 'CUSTOM', label: 'Custom plan' },
  ],
  CLINIC: [
    { value: 'MONTHLY', label: 'Consultation' },
    { value: 'QUARTERLY', label: 'Follow-up cycle' },
    { value: 'HALF_YEARLY', label: 'Treatment plan' },
    { value: 'ANNUAL', label: 'Annual recall' },
    { value: 'DAY_PASS', label: 'Walk-in visit' },
    { value: 'CUSTOM', label: 'Custom care plan' },
  ],
  SALON: [
    { value: 'MONTHLY', label: 'Monthly package' },
    { value: 'QUARTERLY', label: 'Quarterly package' },
    { value: 'HALF_YEARLY', label: 'Half-year package' },
    { value: 'ANNUAL', label: 'Annual package' },
    { value: 'DAY_PASS', label: 'Single visit' },
    { value: 'CUSTOM', label: 'Custom service plan' },
  ],
  COACHING: [
    { value: 'MONTHLY', label: 'Monthly fee cycle' },
    { value: 'QUARTERLY', label: 'Quarterly fee cycle' },
    { value: 'HALF_YEARLY', label: 'Term fee cycle' },
    { value: 'ANNUAL', label: 'Annual program' },
    { value: 'DAY_PASS', label: 'Trial class' },
    { value: 'CUSTOM', label: 'Custom batch plan' },
  ],
  REAL_ESTATE: [
    { value: 'MONTHLY', label: 'New inquiry' },
    { value: 'QUARTERLY', label: 'Qualified prospect' },
    { value: 'HALF_YEARLY', label: 'Site visit' },
    { value: 'ANNUAL', label: 'Long-cycle deal' },
    { value: 'DAY_PASS', label: 'Walk-in lead' },
    { value: 'CUSTOM', label: 'Custom deal stage' },
  ],
  DENTAL: [
    { value: 'MONTHLY', label: 'Appointment' },
    { value: 'QUARTERLY', label: 'Treatment follow-up' },
    { value: 'HALF_YEARLY', label: 'Six-month recall' },
    { value: 'ANNUAL', label: 'Annual recall' },
    { value: 'DAY_PASS', label: 'New patient visit' },
    { value: 'CUSTOM', label: 'Custom treatment plan' },
  ],
  AGENCY: [
    { value: 'MONTHLY', label: 'Monthly retainer' },
    { value: 'QUARTERLY', label: 'Quarterly retainer' },
    { value: 'HALF_YEARLY', label: 'Half-year contract' },
    { value: 'ANNUAL', label: 'Annual contract' },
    { value: 'DAY_PASS', label: 'Proposal follow-up' },
    { value: 'CUSTOM', label: 'Custom engagement' },
  ],
  OTHER: [
    { value: 'MONTHLY', label: 'Monthly cycle' },
    { value: 'QUARTERLY', label: 'Quarterly cycle' },
    { value: 'HALF_YEARLY', label: 'Half-year cycle' },
    { value: 'ANNUAL', label: 'Annual cycle' },
    { value: 'DAY_PASS', label: 'One-time visit' },
    { value: 'CUSTOM', label: 'Custom cycle' },
  ],
};

export function getVerticalPack(businessType?: string | null): VerticalPack {
  const key = (businessType || 'OTHER').toUpperCase() as BusinessType;
  return VERTICAL_PACKS[key] || VERTICAL_PACKS.OTHER;
}

export function getVerticalTemplates(businessType?: string | null): VerticalTemplate[] {
  return getVerticalPack(businessType).templates;
}

export function getRetentionOptions(businessType?: string | null): RetentionOption[] {
  return RETENTION_OPTIONS[getVerticalPack(businessType).businessType];
}
