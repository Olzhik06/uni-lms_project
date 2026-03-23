import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsArray, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '@prisma/client';

export class CreateQuizDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(300) timeLimitMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxAttempts?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() shuffleQuestions?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showResults?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() availableFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() availableUntil?: string;
}

export class UpdateQuizDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(300) timeLimitMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxAttempts?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() shuffleQuestions?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showResults?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() availableFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() availableUntil?: string;
}

export class AddQuestionDto {
  @ApiProperty({ enum: QuestionType }) @IsEnum(QuestionType) type: QuestionType;
  @ApiProperty() @IsString() body: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() options?: string[];
  @ApiPropertyOptional() @IsOptional() correctOption?: number | number[] | boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() explanation?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) points?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() orderIndex?: number;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() options?: string[];
  @ApiPropertyOptional() @IsOptional() correctOption?: number | number[] | boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() explanation?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) points?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() orderIndex?: number;
}

export class ReorderQuestionsDto {
  @ApiProperty({ type: [String] }) @IsArray() order: string[];
}

export class SubmitAttemptDto {
  @ApiProperty({ description: 'Map of questionId → answer' })
  answers: Record<string, number | number[] | boolean | string | null>;

  @ApiPropertyOptional() @IsOptional() @IsInt() timeTakenSeconds?: number;
}

export class GradeShortAnswerDto {
  @ApiProperty({ description: 'Map of answerRecordId → { points, note }' })
  grades: Record<string, { points: number; note?: string }>;
}
