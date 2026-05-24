import { BadRequestException } from '@nestjs/common';
import { ProgramsService } from './programs.service';

describe('ProgramsService', () => {
  const pool = {
    query: jest.fn(),
  };

  const service = new ProgramsService(pool as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws BadRequestException if required fields are missing', async () => {
    await expect(
      service.create({
        program_code: '',
        program_name: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('countPrograms returns numeric count', async () => {
    pool.query.mockResolvedValue({ rows: [{ count: '7' }] });

    const result = await service.countPrograms({});
    expect(result).toEqual({ count: 7 });
  });
});
