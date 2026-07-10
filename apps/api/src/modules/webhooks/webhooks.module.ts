import { Module } from '@nestjs/common';
import { Controller, Post, Get, Body, Query, Headers, Param, Req, UseGuards, Inject, Injectable } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaClient } from '@revorax/database';
import { WhatsAppClient } from '@revorax/whatsapp';
import { MessagesService } from '../messages/messages.service';
import { MessagesModule } from '../messages/messages.module';
import { Public } from '../auth/decorators/public.decorator';

@Injectable()
class WebhooksService {
  private whatsapp = new WhatsAppClient();

  constructor(@Inject('PRISMA') private prisma: PrismaClient, private messagesService: MessagesService) {}

  verifyWhatsApp(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe') return this.whatsapp.verifyWebhook(token, challenge);
    return null;
  }

  async handleWhatsApp(payload: unknown) {
    const parsed = this.whatsapp.parseWebhookEvent(payload as any);

    if (parsed.type === 'message') {
      const data = parsed.data as { from: string; text: string; messageId: string; senderName: string };
      // Find which org owns this WhatsApp number
      // For now, handle inbound messages across all orgs by matching the number
      const orgs = await this.prisma.organization.findMany({ where: { isActive: true, deletedAt: null } });
      for (const org of orgs) {
        await this.messagesService.handleInboundWebhook(org.id, data).catch(() => {});
      }
    }

    if (parsed.type === 'status') {
      const data = parsed.data as { messageId: string; status: string };
      const statusMap: Record<string, string> = { sent: 'SENT', delivered: 'DELIVERED', read: 'READ', failed: 'FAILED' };
      await this.prisma.message.updateMany({
        where: { externalId: data.messageId },
        data: {
          status: (statusMap[data.status] || 'SENT') as any,
          ...(data.status === 'delivered' && { deliveredAt: new Date() }),
          ...(data.status === 'read' && { readAt: new Date() }),
          ...(data.status === 'failed' && { failedAt: new Date() }),
        },
      });
    }

    return { processed: true };
  }
}

@ApiTags('Webhooks')
@Controller('webhooks')
class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get('whatsapp')
  @Public()
  @ApiOperation({ summary: 'WhatsApp webhook verification (GET)' })
  verifyWhatsApp(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const result = this.webhooksService.verifyWhatsApp(mode, token, challenge);
    return result || 'Forbidden';
  }

  @Post('whatsapp')
  @Public()
  @ApiOperation({ summary: 'WhatsApp webhook event handler (POST)' })
  handleWhatsApp(@Body() body: unknown) {
    return this.webhooksService.handleWhatsApp(body);
  }
}

@Module({
  imports: [MessagesModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
