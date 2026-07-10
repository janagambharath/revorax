import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaClient } from '@revorax/database';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Allow public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    // Validate session via Better Auth session lookup
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: { include: { org: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    // Attach user to request
    request.user = session.user;
    request.orgId = session.user.orgId;
    request.session = session;

    // Check required roles
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(session.user.role);
      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied. Required role: ${requiredRoles.join(' or ')}`,
        );
      }
    }

    return true;
  }

  private extractToken(request: { cookies: Record<string, string>; headers: Record<string, string> }): string | null {
    // Try cookie first (preferred)
    if (request.cookies?.['revorax.session_token']) {
      return request.cookies['revorax.session_token'];
    }
    // Fallback to Authorization header
    const authHeader = request.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return null;
  }
}
