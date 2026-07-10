import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';

@ApiTags('Members')
@Controller('members')
@UseGuards(AuthGuard)
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'List all members with filters' })
  findAll(
    @OrgId() orgId: string,
    @Query() query: { page?: number; limit?: number; search?: string; status?: string; membershipType?: string },
  ) {
    return this.membersService.findAll(orgId, query);
  }

  @Get('expiring-soon')
  @ApiOperation({ summary: 'Members expiring in next N days' })
  expiringSoon(@OrgId() orgId: string, @Query('days') days?: number) {
    return this.membersService.getExpiringSoon(orgId, days ? Number(days) : 7);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Expired members needing follow-up' })
  overdue(@OrgId() orgId: string) {
    return this.membersService.getOverdue(orgId);
  }

  @Get('reactivation')
  @ApiOperation({ summary: 'Recent expired members for reactivation' })
  reactivation(@OrgId() orgId: string) {
    return this.membersService.getReactivationList(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get member detail with messages, notes, tasks' })
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.membersService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new member' })
  create(@OrgId() orgId: string, @Body() body: { contactId: string; membershipType: string; status?: string; startDate: string; renewalDate: string; amount: number; notes?: string; goals?: string }) {
    return this.membersService.create(orgId, body);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import members from CSV' })
  importCsv(@OrgId() orgId: string, @Body() body: { members: any[] }) {
    return this.membersService.importCsv(orgId, body.members);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update member' })
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.membersService.update(orgId, id, body);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Record a payment for a member' })
  recordPayment(@OrgId() orgId: string, @Body() body: { memberId: string; amount: number; method: string; paidAt?: string; notes?: string }) {
    return this.membersService.recordPayment(orgId, body);
  }

  @Post(':id/follow-up')
  @ApiOperation({ summary: 'Mark a member as followed up' })
  markFollowUp(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    return this.membersService.markFollowUp(orgId, id, body?.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a member' })
  delete(@OrgId() orgId: string, @Param('id') id: string) {
    return this.membersService.delete(orgId, id);
  }
}
