import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export class CreateAssignmentDto { @ApiProperty() @IsString() @IsNotEmpty() title: string; @ApiPropertyOptional() @IsString() @IsOptional() description?: string; @ApiProperty() @IsDateString() dueAt: string; @ApiPropertyOptional() @IsInt() @IsOptional() @Type(() => Number) maxScore?: number; }
export class UpdateAssignmentDto { @ApiPropertyOptional() @IsString() @IsOptional() title?: string; @ApiPropertyOptional() @IsString() @IsOptional() description?: string; @ApiPropertyOptional() @IsDateString() @IsOptional() dueAt?: string; @ApiPropertyOptional() @IsInt() @IsOptional() @Type(() => Number) maxScore?: number; }
export class SubmitDto { @ApiPropertyOptional() @IsString() @IsOptional() contentText?: string; @ApiPropertyOptional() @IsString() @IsOptional() contentUrl?: string; @ApiPropertyOptional() @IsString() @IsOptional() fileUrl?: string; }
export class GradeDto { @ApiProperty() @IsNumber() @Min(0) @Max(10000) @Type(() => Number) score: number; @ApiPropertyOptional() @IsString() @IsOptional() feedback?: string; }
export class CreateCommentDto { @ApiProperty() @IsString() @IsNotEmpty() body: string; }
export class SaveDraftDto { @ApiPropertyOptional() @IsString() @IsOptional() contentText?: string; @ApiPropertyOptional() @IsString() @IsOptional() contentUrl?: string; }
