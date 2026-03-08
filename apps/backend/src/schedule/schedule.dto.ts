import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleType } from '@prisma/client';
export class CreateScheduleItemDto { @ApiProperty() @IsDateString() startsAt: string; @ApiProperty() @IsDateString() endsAt: string; @ApiProperty() @IsString() @IsNotEmpty() room: string; @ApiProperty({ enum: ScheduleType }) @IsEnum(ScheduleType) type: ScheduleType; @ApiPropertyOptional() @IsString() @IsOptional() groupId?: string; }
