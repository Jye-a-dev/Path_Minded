import { BadRequestException, ConflictException } from '@nestjs/common';

/**
 * Handles common PostgreSQL error codes and throws appropriate NestJS exceptions.
 * @param error - The caught error
 * @param context - Human-readable context for error messages (e.g. table/entity name)
 */
export function handleDatabaseError(error: unknown, context: string): never {
  const code = (error as { code?: string })?.code;

  if (code === '23505') {
    throw new ConflictException(`${context}: duplicate key`);
  }

  if (code === '23503') {
    throw new BadRequestException(`${context}: invalid foreign key`);
  }

  throw error;
}
