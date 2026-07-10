import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';
import { WhatsAppClient } from '@revorax/whatsapp';
import { sendEmail, emailTemplates } from '@revorax/email';
import { paginate, interpolateTemplate } from '@revorax/shared';

@Injectable()
export class MessagesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  private async getWhatsAppClient(orgId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new Error('Organization not found');

    if (org.whatsappPhoneNumberId && org.whatsappAccessToken) {
      return new WhatsAppClient({
        phoneNumberId: org.whatsappPhoneNumberId,
        accessToken: org.whatsappAccessToken,
      });
    }
    // Fallback to global config (useful for testing or single-tenant mode)
    return new WhatsAppClient();
  }

  async findByContact(orgId: string, contactId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { orgId, contactId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { template: true },
      }),
      this.prisma.message.count({ where: { orgId, contactId } }),
    ]);

    return paginate(messages, total, page, limit);
  }

  async sendWhatsApp(orgId: string, params: {
    contactId: string;
    body: string;
    templateId?: string;
    templateVariables?: Record<string, string>;
  }) {
    const contact = await this.prisma.contact.findFirst({ where: { id: params.contactId, orgId } });
    if (!contact?.phone) throw new Error('Contact has no phone number');

    let body = params.body;

    // If using a template, load and interpolate it
    if (params.templateId) {
      const template = await this.prisma.template.findUnique({ where: { id: params.templateId } });
      if (template && params.templateVariables) {
        body = interpolateTemplate(template.body, params.templateVariables);
      }
    }

    // Record message in DB first
    const message = await this.prisma.message.create({
      data: {
        orgId,
        contactId: params.contactId,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        body,
        status: 'QUEUED',
        templateId: params.templateId,
      },
    });

    // Send via WhatsApp Cloud API
    try {
      const whatsapp = await this.getWhatsAppClient(orgId);
      const result = await whatsapp.sendTextMessage({ to: contact.phone, body });
      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: 'SENT', externalId: result.messageId, sentAt: new Date() },
      });
      await this.touchMemberFollowUp(orgId, params.contactId);
      return { success: true, message };
    } catch (err) {
      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: 'FAILED', failReason: String(err), failedAt: new Date() },
      });
      throw err;
    }
  }

  async sendEmail(orgId: string, params: {
    contactId: string;
    subject: string;
    body: string;
    templateId?: string;
  }) {
    const contact = await this.prisma.contact.findFirst({ where: { id: params.contactId, orgId } });
    if (!contact?.email) throw new Error('Contact has no email address');

    const message = await this.prisma.message.create({
      data: {
        orgId,
        contactId: params.contactId,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        body: params.body,
        status: 'QUEUED',
        templateId: params.templateId,
      },
    });

    try {
      const result = await sendEmail({
        to: contact.email,
        subject: params.subject,
        html: `<p style="font-family:sans-serif;color:#333;">${params.body.replace(/\n/g, '<br>')}</p>`,
      });

      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: 'SENT', externalId: result.id, sentAt: new Date() },
      });
      await this.touchMemberFollowUp(orgId, params.contactId);
      return { success: true, message };
    } catch (err) {
      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: 'FAILED', failReason: String(err), failedAt: new Date() },
      });
      throw err;
    }
  }

  async handleInboundWebhook(orgId: string, event: { from: string; text: string; messageId: string; senderName: string }) {
    // Find or create contact by phone
    let contact = await this.prisma.contact.findFirst({
      where: { orgId, phone: { contains: event.from.slice(-10) } },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: { orgId, name: event.senderName || event.from, phone: event.from },
      });
    }

    await this.prisma.message.create({
      data: {
        orgId,
        contactId: contact.id,
        channel: 'WHATSAPP',
        direction: 'INBOUND',
        body: event.text,
        status: 'DELIVERED',
        externalId: event.messageId,
        sentAt: new Date(),
      },
    });

    return { contactId: contact.id };
  }

  private async touchMemberFollowUp(orgId: string, contactId: string) {
    await this.prisma.member.updateMany({
      where: { orgId, contactId, deletedAt: null },
      data: { followUpStatus: 'DONE', lastContactedAt: new Date() },
    });
  }
}
