import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export class CreateGroupDto { @ApiProperty() @IsString() @IsNotEmpty() name: string; @ApiPropertyOptional() @IsString() @IsOptional() degree?: string; @ApiPropertyOptional() @IsInt() @IsOptional() @Type(() => Number) year?: number; }
export class UpdateGroupDto { @ApiPropertyOptional() @IsString() @IsOptional() name?: string; @ApiPropertyOptional() @IsString() @IsOptional() degree?: string; @ApiPropertyOptional() @IsInt() @IsOptional() @Type(() => Number) year?: number; }
