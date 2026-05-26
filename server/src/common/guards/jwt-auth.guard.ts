import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const SWAGGER_ROUTE = process.env.SWAGGER_ROUTE ?? '/docs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Skip auth for requests coming from Swagger UI
    const request = context.switchToHttp().getRequest<Request>();
    const referer = request.headers['referer'] ?? '';
    if (referer.includes(SWAGGER_ROUTE)) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  }
}
