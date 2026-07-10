import { Module } from '@nestjs/common';
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeadsService } from '../crm/crm.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';

@ApiTags('Leads')
@Controller('leads')
@UseGuards(AuthGuard)
class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all leads, optionally filtered by status' })
  findAll(@OrgId() orgId: string, @Query() query: { page?: number; limit?: number; status?: string; assignedToId?: string }) {
    return this.leadsService.findAll(orgId, query);
  }

  @Post()
  create(@OrgId() orgId: string, @Body() body: Record<string, unknown>) {
    return this.leadsService.create(orgId, body);
  }

  @Put(':id')
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.leadsService.update(orgId, id, body);
  }

  @Delete(':id')
  delete(@OrgId() orgId: string, @Param('id') id: string) {
    return this.leadsService.delete(orgId, id);
  }
}

@Module({
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
