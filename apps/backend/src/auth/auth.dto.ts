import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class LoginDto {
  @ApiProperty({ example: 'admin@uni.kz' }) @IsEmail() email: string;
  @ApiProperty({ example: 'Admin123!' }) @IsString() @IsNotEmpty() password: string;
}

export class RegisterDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
  @ApiProperty() @IsString() @IsNotEmpty() fullName: string;
  @ApiPropertyOptional({ enum: Role }) @IsEnum(Role) @IsOptional() role?: Role;
}
