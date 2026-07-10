import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(AuthGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all clients with filters' })
  findAll(
    @OrgId() orgId: string,
    @Query() query: { page?: number; limit?: number; search?: string; status?: string },
  ) {
    return this.clientsService.findAll(orgId, query);
  }

  @Get('lapsed')
  @ApiOperation({ summary: 'Lapsed clients needing re-engagement' })
  lapsed(@OrgId() orgId: string) {
    return this.clientsService.getLapsedList(orgId);
  }

  @Get('scheduled-reminders')
  @ApiOperation({ summary: 'Scheduled booking reminders soon' })
  scheduledReminders(@OrgId() orgId: string, @Query('days') days?: number) {
    return this.clientsService.getScheduledBookings(orgId, days ? Number(days) : 7);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client detail' })
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.clientsService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new client' })
  create(
    @OrgId() orgId: string,
    @Body() body: {
      contactId: string;
      status?: string;
      lastVisitDate: string;
      nextBookingDate?: string;
      averageSpend: number;
      visitCount?: number;
    },
  ) {
    return this.clientsService.create(orgId, body);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import clients from CSV' })
  importCsv(@OrgId() orgId: string, @Body() body: { clients: any[] }) {
    return this.clientsService.importCsv(orgId, body.clients);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update client' })
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.clientsService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a client' })
  delete(@OrgId() orgId: string, @Param('id') id: string) {
    return this.clientsService.delete(orgId, id);
  }
}
