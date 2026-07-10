import { Module } from '@nestjs/common';
import { Injectable, Inject } from '@nestjs/common';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaClient } from '@revorax/database';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';
import { paginate } from '@revorax/shared';

@Injectable()
class AuditService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async log(data: { orgId: string; userId?: string; action: string; entity: string; entityId?: string; oldValue?: unknown; newValue?: unknown }) {
    return this.prisma.auditLog.create({ data: data as any });
  }

  async findAll(orgId: string, query: { page?: number; limit?: number; entity?: string; action?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      orgId,
      ...(query.entity && { entity: query.entity }),
      ...(query.action && { action: query.action as any }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(logs, total, page, limit);
  }
}

@ApiTags('Audit')
@Controller('audit')
@UseGuards(AuthGuard)
class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll(@OrgId() orgId: string, @Query() query: { page?: number; limit?: number; entity?: string; action?: string }) {
    return this.auditService.findAll(orgId, query);
  }
}

@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
