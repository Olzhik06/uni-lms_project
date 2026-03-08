import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CourseRole } from '@prisma/client';
export class CreateEnrollmentDto {
  @ApiProperty() @IsString() @IsNotEmpty() userId: string;
  @ApiProperty() @IsString() @IsNotEmpty() courseId: string;
  @ApiProperty({ enum: CourseRole }) @IsEnum(CourseRole) roleInCourse: CourseRole;
}
