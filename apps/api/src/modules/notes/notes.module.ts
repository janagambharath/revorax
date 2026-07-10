import { Module } from '@nestjs/common';
import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotesService } from '../crm/crm.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId, CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notes')
@Controller('notes')
@UseGuards(AuthGuard)
class NotesController {
  constructor(private notesService: NotesService) {}

  @Get('contact/:contactId')
  findByContact(@OrgId() orgId: string, @Param('contactId') contactId: string) {
    return this.notesService.findByContact(orgId, contactId);
  }

  @Post()
  create(@OrgId() orgId: string, @CurrentUser() user: { id: string }, @Body() body: { contactId: string; body: string; isPinned?: boolean }) {
    return this.notesService.create(orgId, user.id, body);
  }

  @Delete(':id')
  delete(@OrgId() orgId: string, @Param('id') id: string) {
    return this.notesService.delete(orgId, id);
  }
}

@Module({
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
