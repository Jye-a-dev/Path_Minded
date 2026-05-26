import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { envConfig } from '../../config/env.config';
import { UserService } from '../users/user.service';
import {
  AuthLoginResponse,
  AuthLogoutResponse,
  AuthUserPayload,
} from './interfaces/auth.interfaces';
import type { UserRole } from '../users/interfaces/users.interfaces';

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

    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async register(
    email: string,
    password: string,
    role: UserRole = 'STUDENT',
  ): Promise<AuthLoginResponse> {
    const user = await this.usersService.create({
      email,
      password,
      role,
    });
    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async loginWithMicrosoft(accessToken: string): Promise<AuthLoginResponse> {
    const profile = await this.fetchMicrosoftProfile(accessToken);
    const email = profile.mail ?? profile.userPrincipalName;
    if (!email) {
      throw new UnauthorizedException('Microsoft account email not found');
    }

    const msProfilePatch = {
      ms_id: profile.id ?? undefined,
      user_principal_name: profile.userPrincipalName ?? undefined,
      display_name: profile.displayName ?? undefined,
      given_name: profile.givenName ?? undefined,
      surname: profile.surname ?? undefined,
      mail: profile.mail ?? undefined,
      job_title: profile.jobTitle ?? undefined,
      mobile_phone: profile.mobilePhone ?? undefined,
      business_phones: profile.businessPhones ?? undefined,
      office_location: profile.officeLocation ?? undefined,
      preferred_language: profile.preferredLanguage ?? undefined,
    };

    const existedUser = await this.usersService.findByEmailWithPassword(email);
    if (existedUser) {
      // Sync latest Microsoft profile data on every login
      await this.usersService.update(existedUser.id, msProfilePatch);
      return this.buildAuthResponse(
        existedUser.id,
        existedUser.email,
        existedUser.role,
      );
    }

    const randomPassword = `ms_${Math.random().toString(36).slice(2, 14)}`;
    const user = await this.usersService.create({
      email,
      password: randomPassword,
      role: 'STUDENT',
    });

    // Save Microsoft profile on first registration
    await this.usersService.update(user.id, msProfilePatch);

    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  logout(): AuthLogoutResponse {
    return { message: 'Logged out successfully' };
  }

  private async fetchMicrosoftProfile(accessToken: string): Promise<{
    id?: string | null;
    mail?: string | null;
    userPrincipalName?: string | null;
    displayName?: string | null;
    givenName?: string | null;
    surname?: string | null;
    jobTitle?: string | null;
    mobilePhone?: string | null;
    businessPhones?: string[] | null;
    officeLocation?: string | null;
    preferredLanguage?: string | null;
  }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Microsoft access token');
    }

    return (await response.json()) as {
      id?: string | null;
      mail?: string | null;
      userPrincipalName?: string | null;
      displayName?: string | null;
      givenName?: string | null;
      surname?: string | null;
      jobTitle?: string | null;
      mobilePhone?: string | null;
      businessPhones?: string[] | null;
      officeLocation?: string | null;
      preferredLanguage?: string | null;
    };
  }

  private async buildAuthResponse(
    id: string,
    email: string,
    role: UserRole,
  ): Promise<AuthLoginResponse> {
    const payload: AuthUserPayload = { sub: id, email, role };
    const accessToken = await this.jwtService.signAsync(payload);
    const env = envConfig();
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: env.JWT_EXPIRES_IN,
      user: { id, email, role },
    };
  }
}
