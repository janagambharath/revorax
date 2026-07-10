import { Module } from '@nestjs/common';
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId, CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(AuthGuard)
class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(@OrgId() orgId: string, @Query() query: { status?: string; assignedToId?: string; page?: number; limit?: number }) {
    return this.tasksService.findAll(orgId, query);
  }

  @Post()
  create(@OrgId() orgId: string, @CurrentUser() user: { id: string }, @Body() body: Record<string, unknown>) {
    return this.tasksService.create(orgId, user.id, body);
  }

  @Put(':id')
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.tasksService.update(orgId, id, body);
  }

  @Delete(':id')
  delete(@OrgId() orgId: string, @Param('id') id: string) {
    return this.tasksService.delete(orgId, id);
  }
}

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
