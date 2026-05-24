import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import type { AuthLoginResponse } from './interfaces/auth.interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Login and receive access token' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Authenticated successfully' })
  @Post('login')
  login(@Body() payload: LoginDto): Promise<AuthLoginResponse> {
    return this.authService.login(payload.email, payload.password);
  }
}
