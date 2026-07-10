import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';
import { paginate } from '@revorax/shared';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class CampaignsService {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private messagesService: MessagesService,
  ) {}

  async findAll(orgId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { orgId, deletedAt: null },
        skip,
        take: limit,
        include: { template: true, createdBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.campaign.count({ where: { orgId, deletedAt: null } }),
    ]);

    return paginate(campaigns, total, page, limit);
  }

  async create(orgId: string, userId: string, data: {
    name: string;
    channel: string;
    templateId?: string;
    customBody?: string;
    audienceFilter?: Record<string, unknown>;
    scheduledAt?: string;
  }) {
    // Build audience
    const recipients = await this.buildAudience(orgId, data.audienceFilter || {}, data.channel);

    return this.prisma.campaign.create({
      data: {
        orgId,
        createdById: userId,
        name: data.name,
        channel: data.channel as any,
        templateId: data.templateId,
        customBody: data.customBody,
        audienceFilter: data.audienceFilter || {},
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        recipientCount: recipients.length,
        recipients: {
          create: recipients.map((contactId) => ({ contactId })),
        },
      },
      include: { template: true, _count: { select: { recipients: true } } },
    });
  }

  async previewAudience(orgId: string, filter: Record<string, unknown>, channel: string) {
    const contacts = await this.buildAudience(orgId, filter, channel);
    return { count: contacts.length, contactIds: contacts.slice(0, 5) };
  }

  async execute(orgId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, orgId, deletedAt: null },
      include: { template: true, recipients: { include: { contact: true } } },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status === 'COMPLETED') throw new Error('Campaign already completed');

    // Mark as running
    await this.prisma.campaign.update({ where: { id: campaignId }, data: { status: 'RUNNING', startedAt: new Date() } });

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of campaign.recipients) {
      try {
        const body = campaign.customBody || campaign.template?.body || '';
        const interpolated = body
          .replace(/{{name}}/g, recipient.contact.name)
          .replace(/{{phone}}/g, recipient.contact.phone || '')
          .replace(/{{email}}/g, recipient.contact.email || '');

        if (campaign.channel === 'WHATSAPP') {
          await this.messagesService.sendWhatsApp(orgId, {
            contactId: recipient.contactId,
            body: interpolated,
            templateId: campaign.templateId || undefined,
          });
        } else if (campaign.channel === 'EMAIL' && recipient.contact.email) {
          await this.messagesService.sendEmail(orgId, {
            contactId: recipient.contactId,
            subject: campaign.template?.subject || campaign.name,
            body: interpolated,
            templateId: campaign.templateId || undefined,
          });
        }

        await this.prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        sentCount++;

        // Small delay to respect rate limits
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        await this.prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED', error: String(err) },
        });
        failedCount++;
      }
    }

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED', completedAt: new Date(), sentCount, failedCount },
    });
  }

  private async buildAudience(orgId: string, filter: Record<string, unknown>, channel: string): Promise<string[]> {
    const where: Record<string, unknown> = {
      orgId,
      deletedAt: null,
      ...(channel === 'WHATSAPP' && { phone: { not: null } }),
      ...(channel === 'EMAIL' && { email: { not: null } }),
    };

    if (filter.memberStatus && Array.isArray(filter.memberStatus) && filter.memberStatus.length > 0) {
      where.member = { status: { in: filter.memberStatus } };
    }

    const contacts = await this.prisma.contact.findMany({
      where,
      select: { id: true },
      take: 1000,
    });

    return contacts.map((c) => c.id);
  }

  async delete(orgId: string, id: string) {
    return this.prisma.campaign.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
