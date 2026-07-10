import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(AuthGuard)
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all patients with filters' })
  findAll(
    @OrgId() orgId: string,
    @Query() query: { page?: number; limit?: number; search?: string; status?: string },
  ) {
    return this.patientsService.findAll(orgId, query);
  }

  @Get('recalls')
  @ApiOperation({ summary: 'Patients needing recalls' })
  recalls(@OrgId() orgId: string) {
    return this.patientsService.getRecallList(orgId);
  }

  @Get('scheduled-reminders')
  @ApiOperation({ summary: 'Scheduled appointment reminders soon' })
  scheduledReminders(@OrgId() orgId: string, @Query('days') days?: number) {
    return this.patientsService.getScheduledRecalls(orgId, days ? Number(days) : 7);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient detail' })
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.patientsService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new patient' })
  create(
    @OrgId() orgId: string,
    @Body() body: {
      contactId: string;
      patientCode?: string;
      status?: string;
      lastAppointmentDate: string;
      nextAppointmentDate?: string;
      missedAppointmentCount?: number;
      treatmentValue: number;
    },
  ) {
    return this.patientsService.create(orgId, body);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import patients from CSV' })
  importCsv(@OrgId() orgId: string, @Body() body: { patients: any[] }) {
    return this.patientsService.importCsv(orgId, body.patients);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update patient' })
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() body: Record<string, any>) {
    return this.patientsService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a patient' })
  delete(@OrgId() orgId: string, @Param('id') id: string) {
    return this.patientsService.delete(orgId, id);
  }
}
