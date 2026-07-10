import { Module } from '@nestjs/common';
import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { MessagesModule } from '../messages/messages.module';
import { MessagesService } from '../messages/messages.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId, CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseGuards(AuthGuard)
class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get()
  findAll(@OrgId() orgId: string, @Query() query: { page?: number; limit?: number }) {
    return this.campaignsService.findAll(orgId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create and schedule a campaign' })
  create(@OrgId() orgId: string, @CurrentUser() user: { id: string }, @Body() body: { name: string; channel: string; templateId?: string; customBody?: string; audienceFilter?: Record<string, unknown>; scheduledAt?: string }) {
    return this.campaignsService.create(orgId, user.id, body);
  }

  @Post('preview-audience')
  @ApiOperation({ summary: 'Preview recipient count for audience filter' })
  previewAudience(@OrgId() orgId: string, @Body() body: { filter: Record<string, unknown>; channel: string }) {
    return this.campaignsService.previewAudience(orgId, body.filter, body.channel);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute (send) a campaign immediately' })
  execute(@OrgId() orgId: string, @Param('id') id: string) {
    return this.campaignsService.execute(orgId, id);
  }

  @Delete(':id')
  delete(@OrgId() orgId: string, @Param('id') id: string) {
    return this.campaignsService.delete(orgId, id);
  }
}

@Module({
  imports: [MessagesModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
