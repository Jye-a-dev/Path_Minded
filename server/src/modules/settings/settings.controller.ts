import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@UseGuards(RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiOperation({ summary: 'Get all system settings' })
  @ApiOkResponse({
    description: 'System settings retrieved successfully',
    schema: {
      example: {
        advisor_email: 'cvht@vlu.edu.vn',
        training_hotline: '(028) 7109 9221',
        asc_portal_url: 'https://asc.vlu.edu.vn',
      },
    },
  })
  @Get()
  getSettings(): Promise<Record<string, string>> {
    return this.settingsService.getSettings();
  }

  @ApiOperation({ summary: 'Update system settings (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: { type: 'string' },
      example: {
        advisor_email: 'cvht@vlu.edu.vn',
        training_hotline: '(028) 7109 9221',
        asc_portal_url: 'https://asc.vlu.edu.vn',
      },
    },
  })
  @ApiOkResponse({
    description: 'System settings updated successfully',
  })
  @Roles('ADMIN')
  @Put()
  updateSettings(
    @Body() payload: Record<string, string>,
  ): Promise<Record<string, string>> {
    return this.settingsService.updateSettings(payload);
  }
}
