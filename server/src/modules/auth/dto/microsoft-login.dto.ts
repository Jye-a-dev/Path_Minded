import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class MicrosoftLoginDto {
  @ApiProperty({
    example: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6I...',
    description: 'Microsoft OAuth access token from frontend sign-in flow',
  })
  @IsString()
  @MinLength(10)
  accessToken: string;
}
