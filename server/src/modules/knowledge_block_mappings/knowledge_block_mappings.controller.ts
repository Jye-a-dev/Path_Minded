import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { KnowledgeBlockMappingsService } from './knowledge_block_mappings.service';

@Controller('knowledge_block_mappings')
export class KnowledgeBlockMappingsController {
  constructor(private readonly service: KnowledgeBlockMappingsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body() body: { knowledge_block: string; label: string; phrases?: string[] },
  ) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { phrases?: string[]; label?: string },
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
