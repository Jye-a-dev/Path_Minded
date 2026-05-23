import { Module } from '@nestjs/common';
import { ParseWarningsController } from './parse_warnings.controller';
import { ParseWarningsService } from './parse_warnings.service';

@Module({
  controllers: [ParseWarningsController],
  providers: [ParseWarningsService],
  exports: [ParseWarningsService],
})
export class ParseWarningsModule {}

