import { Module } from '@nestjs/common';
import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(AuthGuard)
class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

  @Get('me')
  getMyOrg(@OrgId() orgId: string) {
    return this.orgsService.findOne(orgId);
  }

  @Put('me')
  @Roles('OWNER', 'ADMIN')
  update(@OrgId() orgId: string, @Body() body: Record<string, unknown>) {
    return this.orgsService.update(orgId, body);
  }

  @Get('me/members')
  getMembers(@OrgId() orgId: string) {
    return this.orgsService.getMembers(orgId);
  }

  @Put('me/members/:userId/role')
  @Roles('OWNER', 'ADMIN')
  updateRole(@OrgId() orgId: string, @Param('userId') userId: string, @Body() body: { role: string }) {
    return this.orgsService.updateMemberRole(orgId, userId, body.role);
  }

  @Post('me/members/:userId/deactivate')
  @Roles('OWNER', 'ADMIN')
  deactivate(@OrgId() orgId: string, @Param('userId') userId: string) {
    return this.orgsService.deactivateMember(orgId, userId);
  }
}

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
