import { BadRequestException, ConflictException } from '@nestjs/common';
import { UserService } from './user.service';

describe('UserService', () => {
  const pool = {
    query: jest.fn(),
  };

  const service = new UserService(pool as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws BadRequestException when create payload is missing fields', async () => {
    await expect(
      service.create({ email: '', password: '', role: undefined as never }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps unique violation to ConflictException on create', async () => {
    pool.query.mockRejectedValue({ code: '23505' });

    await expect(
      service.create({
        email: 'dupe@example.com',
        password: 'secret123',
        role: 'STUDENT',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('findByEmailWithPassword returns null when user does not exist', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await service.findByEmailWithPassword('missing@example.com');
    expect(result).toBeNull();
  });
});
