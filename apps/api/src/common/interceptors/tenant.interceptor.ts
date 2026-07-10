import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

// Routes that don't require tenant context
const PUBLIC_ROUTES = [
  '/api/v1/auth/login',
  '/api/v1/auth/signup',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/health',
];

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: any): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const path = request.path || request.url;
    
    // Skip tenant check for public routes
    if (PUBLIC_ROUTES.some(r => path.startsWith(r))) {
      return next.handle();
    }

    // Get orgId and businessType from request user (populated by AuthGuard)
    const orgId = request.user?.orgId;
    const businessType = request.user?.org?.businessType;
    
    // Enforce tenant isolation — reject requests without org context
    if (!orgId && request.user) {
      throw new ForbiddenException('No organization context. Please ensure your account is linked to an organization.');
    }

    // Attach tenant context to request
    if (orgId) {
      request.orgId = orgId;
      request.businessType = businessType;
    }
    
    return next.handle();
  }
}
