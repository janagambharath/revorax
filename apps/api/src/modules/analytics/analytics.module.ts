import { Module } from '@nestjs/common';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(AuthGuard)
class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@OrgId() orgId: string) {
    return this.analyticsService.getDashboardMetrics(orgId);
  }

  @Get('revenue-chart')
  getRevenueChart(@OrgId() orgId: string, @Query('months') months?: number) {
    return this.analyticsService.getRevenueChart(orgId, months ? Number(months) : 6);
  }

  @Get('member-status')
  getMemberStatus(@OrgId() orgId: string) {
    return this.analyticsService.getMemberStatusChart(orgId);
  }

  @Get('lead-funnel')
  getLeadFunnel(@OrgId() orgId: string) {
    return this.analyticsService.getLeadFunnel(orgId);
  }

  @Get('campaigns')
  getCampaignPerformance(@OrgId() orgId: string) {
    return this.analyticsService.getCampaignPerformance(orgId);
  }

  @Get('activity')
  getActivity(@OrgId() orgId: string) {
    return this.analyticsService.getRecentActivity(orgId);
  }
}

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
