import type { StringValue } from 'ms';

export type EnvConfig = {
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_SSL: boolean;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: number | StringValue;
};

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const envConfig = (): EnvConfig => ({
  PORT: toNumber(process.env.PORT, 3000),
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: toNumber(process.env.DB_PORT, 5432),
  DB_USER: process.env.DB_USER ?? 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD ?? 'postgres',
  DB_NAME: process.env.DB_NAME ?? 'PathMinded_DB',
  DB_SSL: toBoolean(process.env.DB_SSL, false),
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev_jwt_secret_change_me',
  JWT_EXPIRES_IN:
    (process.env.JWT_EXPIRES_IN as StringValue | undefined) ?? '1d',
});
