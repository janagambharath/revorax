import { Module } from '@nestjs/common';
import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(AuthGuard)
class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('contact/:contactId')
  findByContact(@OrgId() orgId: string, @Param('contactId') contactId: string, @Query() query: { page?: number; limit?: number }) {
    return this.messagesService.findByContact(orgId, contactId, query);
  }

  @Post('send/whatsapp')
  sendWhatsApp(@OrgId() orgId: string, @Body() body: { contactId: string; body: string; templateId?: string; templateVariables?: Record<string, string> }) {
    return this.messagesService.sendWhatsApp(orgId, body);
  }

  @Post('send/email')
  sendEmail(@OrgId() orgId: string, @Body() body: { contactId: string; subject: string; body: string; templateId?: string }) {
    return this.messagesService.sendEmail(orgId, body);
  }
}

@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
