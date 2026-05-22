import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { appConfig } from '../config/app.config';
import { DB_PROVIDER } from '../constants/app.constant';

export const pgProvider: Provider = {
  provide: DB_PROVIDER.PG_POOL,
  useFactory: () => {
    const { database } = appConfig();

    const pool = new Pool({
      host: database.host,
      port: database.port,
      user: database.user,
      password: database.password,
      database: database.database,
      ssl: database.ssl ? { rejectUnauthorized: false } : false,
    });

    return pool;
  },
};
