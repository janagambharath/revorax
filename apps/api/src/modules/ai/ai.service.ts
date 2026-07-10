import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';
import {
  generateFollowUpMessage,
  classifyAndScoreLead,
  suggestNextAction,
  generateCampaignCopy,
  summarizeContactHistory,
} from '@revorax/ai';
import { getVerticalPack } from '@revorax/shared';

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
    const pack = getVerticalPack(org?.businessType);

    const message = await generateFollowUpMessage({
      contactName: contact.name,
      businessName: org?.name || 'the business',
      businessType: pack.targetNiche,
      channel: params.channel as 'WHATSAPP' | 'EMAIL',
      context: params.context || (contact.member ? `${pack.primaryEntity} status: ${contact.member.status}` : `${pack.leadLabel} follow-up`),
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
    const pack = getVerticalPack(org?.businessType);

    const result = await classifyAndScoreLead({
      contactName: lead.contact.name,
      source: lead.source,
      notes: lead.notes || '',
      interactions: lead.contact.messages.map((m) => m.body).slice(0, 5),
      businessType: pack.targetNiche,
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
    const pack = getVerticalPack(org?.businessType);
    const lastMessage = contact.messages[0];
    const daysSinceContact = lastMessage
      ? Math.floor((Date.now() - lastMessage.createdAt.getTime()) / 86400000)
      : 999;

    return suggestNextAction({
      contactName: contact.name,
      businessType: pack.targetNiche,
      memberStatus: contact.member?.status,
      lastContactDays: daysSinceContact,
      openTasks: contact.tasks.map((t) => t.title),
      recentMessages: contact.messages.map((m) => m.body),
    });
  }

  async generateCopy(orgId: string, params: { purpose: string; channel: string; audience?: string; tone?: string }) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    const pack = getVerticalPack(org?.businessType);

    return generateCampaignCopy({
      purpose: params.purpose,
      businessName: org?.name || 'the business',
      businessType: pack.targetNiche,
      channel: params.channel as 'WHATSAPP' | 'EMAIL',
      audience: params.audience || pack.campaignAudienceLabel,
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
    const pack = getVerticalPack(org?.businessType);

    return summarizeContactHistory({
      contactName: contact.name,
      notes: contact.notesList.map((n) => n.body),
      messages: contact.messages.map((m) => `[${m.direction}] ${m.body}`),
      businessType: pack.targetNiche,
    });
  }
}
