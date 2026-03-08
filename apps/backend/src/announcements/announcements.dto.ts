import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateAnnouncementDto { @ApiProperty() @IsString() @IsNotEmpty() title: string; @ApiProperty() @IsString() @IsNotEmpty() body: string; @ApiPropertyOptional() @IsString() @IsOptional() courseId?: string; }
