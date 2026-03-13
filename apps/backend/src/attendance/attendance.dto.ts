import { IsString, IsIn, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkAttendanceDto {
  @ApiProperty() @IsString() studentId: string;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty({ enum: ['PRESENT', 'ABSENT', 'LATE'] }) @IsIn(['PRESENT', 'ABSENT', 'LATE']) status: string;
}
