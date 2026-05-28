import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { MicrosoftLoginDto } from './dto/microsoft-login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import type {
  AuthLoginResponse,
  AuthLogoutResponse,
} from './interfaces/auth.interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Login and receive access token' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Authenticated successfully',
    schema: {
      example: {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMjMwM2E3MS1mMGFkLTRmZmItOGFjMi1jNDYwODdkZWJjYzkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzE2NjI0MDAwLCJleHAiOjE3MTY3MTA0MDB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        tokenType: 'Bearer',
        expiresIn: '1d',
        user: {
          id: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      },
    },
  })
  @Post('login')
  login(@Body() payload: LoginDto): Promise<AuthLoginResponse> {
    return this.authService.login(payload.email, payload.password);
  }

  @Public()
  @ApiOperation({ summary: 'Register user and receive access token' })
  @ApiBody({ type: RegisterDto })
  @Post('register')
  register(@Body() payload: RegisterDto): Promise<AuthLoginResponse> {
    return this.authService.register(
      payload.email,
      payload.password,
      payload.role ?? 'STUDENT',
    );
  }

  @Public()
  @ApiOperation({ summary: 'Login with Microsoft access token' })
  @ApiBody({ type: MicrosoftLoginDto })
  @Post('login/microsoft')
  loginWithMicrosoft(
    @Body() payload: MicrosoftLoginDto,
  ): Promise<AuthLoginResponse> {
    return this.authService.loginWithMicrosoft(payload.accessToken);
  }

  @Public()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string' },
      },
      required: ['refreshToken'],
    },
  })
  @Post('refresh')
  refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<AuthLoginResponse> {
    return this.authService.refresh(refreshToken);
  }

  @ApiOperation({ summary: 'Logout current session' })
  @ApiOkResponse({
    description: 'Logout response',
    schema: { example: { message: 'Logged out successfully' } },
  })
  @Post('logout')
  logout(): AuthLogoutResponse {
    return this.authService.logout();
  }
}
