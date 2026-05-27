import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CourseTypeMappingsService } from './course_type_mappings.service';

@Controller('course_type_mappings')
export class CourseTypeMappingsController {
  constructor(private readonly service: CourseTypeMappingsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { phrases?: string[]; label?: string },
  ) {
    return this.service.update(id, body);
  }
}
