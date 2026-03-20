import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignmentFeedbackDto {
  @ApiProperty() @IsString() @IsNotEmpty() assignmentId: string;
  @ApiProperty() @IsString() @IsNotEmpty() submissionId: string;
}

export class GenerateQuizDto {
  @ApiProperty() @IsString() @IsNotEmpty() courseId: string;
  @ApiProperty() @IsString() @IsNotEmpty() topic: string;
  @ApiPropertyOptional({ default: 5 }) @IsOptional() @IsInt() @Min(1) @Max(20) questionCount?: number;
  @ApiPropertyOptional({ enum: ['easy','medium','hard'], default: 'medium' })
  @IsOptional() @IsIn(['easy','medium','hard']) difficulty?: string;
}

export class CourseSummaryDto {
  @ApiProperty() @IsString() @IsNotEmpty() courseId: string;
}

export class StudentAnalysisDto {
  @ApiProperty() @IsString() @IsNotEmpty() studentId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() courseId?: string;
}

export class ChatMessageDto {
  @ApiProperty() @IsString() @IsNotEmpty() message: string;
  @ApiPropertyOptional() @IsOptional() @IsString() context?: string;
}
