import { Module } from '@nestjs/common';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaClient } from '@revorax/database';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';

@Injectable()
class TemplatesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(orgId: string, query: { channel?: string; category?: string }) {
    return this.prisma.template.findMany({
      where: { orgId, deletedAt: null, ...(query.channel && { channel: query.channel as any }), ...(query.category && { category: query.category as any }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const t = await this.prisma.template.findFirst({ where: { id, orgId, deletedAt: null } });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  async create(orgId: string, data: { name: string; channel: string; category?: string; subject?: string; body: string }) {
    // Extract variables from body like {{name}}, {{renewal_date}}
    const variables = [...data.body.matchAll(/{{(\w+)}}/g)].map((m) => `{{${m[1]}}}`);
    return this.prisma.template.create({
      data: { orgId, ...data, variables, channel: data.channel as any, category: (data.category || 'CUSTOM') as any },
    });
  }

  async update(orgId: string, id: string, data: Partial<{ name: string; body: string; subject: string }>) {
    await this.findOne(orgId, id);
    const variables = data.body ? [...data.body.matchAll(/{{(\w+)}}/g)].map((m) => `{{${m[1]}}}`) : undefined;
    return this.prisma.template.update({ where: { id }, data: { ...data, ...(variables && { variables }) } });
  }

  async delete(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.template.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

@ApiTags('Templates')
@Controller('templates')
@UseGuards(AuthGuard)
class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  findAll(@OrgId() orgId: string, @Query() query: { channel?: string; category?: string }) {
    return this.templatesService.findAll(orgId, query);
  }

  @Get(':id')
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.templatesService.findOne(orgId, id);
  }

  @Post()
  create(@OrgId() orgId: string, @Body() body: { name: string; channel: string; category?: string; subject?: string; body: string }) {
    return this.templatesService.create(orgId, body);
  }

  @Put(':id')
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.templatesService.update(orgId, id, body as any);
  }

  @Delete(':id')
  delete(@OrgId() orgId: string, @Param('id') id: string) {
    return this.templatesService.delete(orgId, id);
  }
}

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
