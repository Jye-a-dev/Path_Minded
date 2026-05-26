import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { UserRole } from '../../modules/users/interfaces/users.interfaces';

type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

const SWAGGER_ROUTE = process.env.SWAGGER_ROUTE ?? '/docs';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Skip role check for requests coming from Swagger UI
    const request = context.switchToHttp().getRequest<Request>();
    const referer = request.headers['referer'] ?? '';
    if (referer.includes(SWAGGER_ROUTE)) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const role = req.user?.role;
    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
