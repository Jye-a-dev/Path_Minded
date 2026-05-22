import { Global, Module } from '@nestjs/common';
import { pgProvider } from './pg.provider';

@Global()
@Module({
  providers: [pgProvider],
  exports: [pgProvider],
})
export class DatabaseModule {}
