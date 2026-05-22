import { APP_CONFIG } from '../constants/app.constant';
import { envConfig } from './env.config';

export const appConfig = () => {
  const env = envConfig();

  return {
    port: env.PORT ?? APP_CONFIG.DEFAULT_PORT,
    database: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      ssl: env.DB_SSL,
    },
  };
};
