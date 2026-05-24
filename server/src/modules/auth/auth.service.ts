import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { envConfig } from '../../config/env.config';
import { UserService } from '../users/user.service';
import {
  AuthLoginResponse,
  AuthUserPayload,
} from './interfaces/auth.interfaces';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<AuthLoginResponse> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || user.password_hash !== password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: AuthUserPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const env = envConfig();

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: env.JWT_EXPIRES_IN,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
