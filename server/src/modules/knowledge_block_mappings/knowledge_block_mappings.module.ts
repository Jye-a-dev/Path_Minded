import { Module } from '@nestjs/common';
import { KnowledgeBlockMappingsController } from './knowledge_block_mappings.controller';
import { KnowledgeBlockMappingsService } from './knowledge_block_mappings.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [KnowledgeBlockMappingsController],
  providers: [KnowledgeBlockMappingsService],
  exports: [KnowledgeBlockMappingsService],
})
export class KnowledgeBlockMappingsModule {}
