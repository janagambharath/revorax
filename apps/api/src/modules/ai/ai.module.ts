import { Module } from '@nestjs/common';
import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';

@ApiTags('AI')
@Controller('ai')
@UseGuards(AuthGuard)
class AiController {
  constructor(private aiService: AiService) {}

  @Post('follow-up')
  @ApiOperation({ summary: 'Generate AI follow-up message for a contact' })
  generateFollowUp(@OrgId() orgId: string, @Body() body: { contactId: string; channel?: string; context?: string }) {
    return this.aiService.generateFollowUp(orgId, { channel: 'WHATSAPP', ...body });
  }

  @Post('classify-lead/:leadId')
  @ApiOperation({ summary: 'AI lead scoring and classification' })
  classifyLead(@OrgId() orgId: string, @Param('leadId') leadId: string) {
    return this.aiService.classifyLead(orgId, leadId);
  }

  @Post('next-action/:contactId')
  @ApiOperation({ summary: 'AI suggested next action for a contact' })
  nextAction(@OrgId() orgId: string, @Param('contactId') contactId: string) {
    return this.aiService.nextAction(orgId, contactId);
  }

  @Post('generate-copy')
  @ApiOperation({ summary: 'Generate AI campaign copy' })
  generateCopy(@OrgId() orgId: string, @Body() body: { purpose: string; channel?: string; audience?: string; tone?: string }) {
    return this.aiService.generateCopy(orgId, { channel: 'WHATSAPP', ...body });
  }

  @Post('summarize/:contactId')
  @ApiOperation({ summary: 'AI summary of contact history' })
  summarize(@OrgId() orgId: string, @Param('contactId') contactId: string) {
    return this.aiService.summarizeContact(orgId, contactId);
  }
}

@Module({
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
