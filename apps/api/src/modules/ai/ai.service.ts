import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';
import {
  generateFollowUpMessage,
  classifyAndScoreLead,
  suggestNextAction,
  generateCampaignCopy,
  summarizeContactHistory,
} from '@revorax/ai';

@Injectable()
export class AiService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async generateFollowUp(orgId: string, params: { contactId: string; channel: string; context?: string }) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: params.contactId, orgId },
      include: {
        member: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!contact) throw new Error('Contact not found');

    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });

    const message = await generateFollowUpMessage({
      contactName: contact.name,
      businessName: org?.name || 'the business',
      businessType: org?.businessType?.toLowerCase() || 'gym',
      channel: params.channel as 'WHATSAPP' | 'EMAIL',
      context: params.context || (contact.member ? `Member status: ${contact.member.status}` : 'Lead follow-up'),
      memberStatus: contact.member?.status,
    });

    return { suggestion: message, contactName: contact.name };
  }

  async classifyLead(orgId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, orgId },
      include: { contact: { include: { messages: { take: 10 } } } },
    });
    if (!lead) throw new Error('Lead not found');

    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });

    const result = await classifyAndScoreLead({
      contactName: lead.contact.name,
      source: lead.source,
      notes: lead.notes || '',
      interactions: lead.contact.messages.map((m) => m.body).slice(0, 5),
      businessType: org?.businessType?.toLowerCase() || 'gym',
    });

    // Update lead score
    await this.prisma.lead.update({
      where: { id: leadId },
      data: { score: result.score },
    });

    return result;
  }

  async nextAction(orgId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, orgId },
      include: {
        member: true,
        tasks: { where: { status: 'PENDING', deletedAt: null } },
        messages: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!contact) throw new Error('Contact not found');

    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    const lastMessage = contact.messages[0];
    const daysSinceContact = lastMessage
      ? Math.floor((Date.now() - lastMessage.createdAt.getTime()) / 86400000)
      : 999;

    return suggestNextAction({
      contactName: contact.name,
      businessType: org?.businessType?.toLowerCase() || 'gym',
      memberStatus: contact.member?.status,
      lastContactDays: daysSinceContact,
      openTasks: contact.tasks.map((t) => t.title),
      recentMessages: contact.messages.map((m) => m.body),
    });
  }

  async generateCopy(orgId: string, params: { purpose: string; channel: string; audience?: string; tone?: string }) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });

    return generateCampaignCopy({
      purpose: params.purpose,
      businessName: org?.name || 'the business',
      businessType: org?.businessType?.toLowerCase() || 'gym',
      channel: params.channel as 'WHATSAPP' | 'EMAIL',
      audience: params.audience || 'existing members',
      tone: (params.tone || 'friendly') as 'professional' | 'friendly' | 'urgent',
    });
  }

  async summarizeContact(orgId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, orgId },
      include: {
        notesList: { take: 10, orderBy: { createdAt: 'desc' } },
        messages: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!contact) throw new Error('Contact not found');

    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });

    return summarizeContactHistory({
      contactName: contact.name,
      notes: contact.notesList.map((n) => n.body),
      messages: contact.messages.map((m) => `[${m.direction}] ${m.body}`),
      businessType: org?.businessType?.toLowerCase() || 'gym',
    });
  }
}
