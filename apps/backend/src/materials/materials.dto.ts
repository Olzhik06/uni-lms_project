import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty({ enum: ['link', 'file', 'text'] }) @IsIn(['link', 'file', 'text']) type: string;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
}
