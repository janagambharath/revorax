// contacts.module.ts
import { Module } from '@nestjs/common';
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContactsService } from '../crm/crm.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';

@ApiTags('Contacts')
@Controller('contacts')
@UseGuards(AuthGuard)
class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  findAll(@OrgId() orgId: string, @Query() query: { page?: number; limit?: number; search?: string; tags?: string }) {
    return this.contactsService.findAll(orgId, query);
  }

  @Get(':id')
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.contactsService.findOne(orgId, id);
  }

  @Post()
  create(@OrgId() orgId: string, @Body() body: Record<string, unknown>) {
    return this.contactsService.create(orgId, body);
  }

  @Put(':id')
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.contactsService.update(orgId, id, body);
  }

  @Delete(':id')
  delete(@OrgId() orgId: string, @Param('id') id: string) {
    return this.contactsService.delete(orgId, id);
  }
}

@Module({
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
