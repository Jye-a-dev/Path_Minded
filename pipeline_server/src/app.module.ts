import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PipelinesModule } from './pipelines/pipelines.module';

@Module({
  imports: [PipelinesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
