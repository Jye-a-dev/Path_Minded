import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';

@Injectable()
export class SettingsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async getSettings(): Promise<Record<string, string>> {
    const result = await this.pool.query<{ key: string; value: string }>(
      'SELECT key, value FROM system_settings',
    );
    const settings: Record<string, string> = {};
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    return settings;
  }

  async updateSettings(
    payload: Record<string, string>,
  ): Promise<Record<string, string>> {
    for (const [key, value] of Object.entries(payload)) {
      await this.pool.query(
        `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE
          SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
        `,
        [key, value],
      );
    }
    return this.getSettings();
  }
}
