import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: any): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Get orgId and businessType from request user (populated by AuthGuard)
    const orgId = request.user?.orgId;
    const businessType = request.user?.org?.businessType;
    
    // Attach directly to request if present
    if (orgId) {
      request.orgId = orgId;
      request.businessType = businessType;
    }
    
    return next.handle();
  }
}
