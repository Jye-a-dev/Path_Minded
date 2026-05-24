import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';

describe('AuthService', () => {
  const usersService = {
    findByEmailWithPassword: jest.fn(),
  } as unknown as UserService;

  const jwtService = {
    signAsync: jest.fn(),
  } as unknown as JwtService;

  const service = new AuthService(usersService, jwtService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns access token when credentials are valid', async () => {
    (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue({
      id: 'u-1',
      email: 'admin@example.com',
      password_hash: 'secret123',
      role: 'ADMIN',
    });
    (jwtService.signAsync as jest.Mock).mockResolvedValue('jwt-token');

    const result = await service.login('admin@example.com', 'secret123');

    expect(result.accessToken).toBe('jwt-token');
    expect(result.user.email).toBe('admin@example.com');
    expect(jwtService.signAsync).toHaveBeenCalled();
  });

  it('throws UnauthorizedException on invalid credentials', async () => {
    (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(null);

    await expect(service.login('x@example.com', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
