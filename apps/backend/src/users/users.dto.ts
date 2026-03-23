import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsIn } from 'class-validator';
import { APP_LANGS } from '../common/i18n';

export class CreateUserDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
  @ApiProperty() @IsString() @IsNotEmpty() fullName: string;
  @ApiProperty({ enum: Role }) @IsEnum(Role) role: Role;
  @ApiPropertyOptional() @IsString() @IsOptional() groupId?: string;
  @ApiPropertyOptional({ enum: APP_LANGS }) @IsOptional() @IsIn(APP_LANGS) preferredLang?: string;
}
export class UpdateUserDto {
  @ApiPropertyOptional() @IsEmail() @IsOptional() email?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() fullName?: string;
  @ApiPropertyOptional({ enum: Role }) @IsEnum(Role) @IsOptional() role?: Role;
  @ApiPropertyOptional() @IsString() @IsOptional() groupId?: string;
  @ApiPropertyOptional() @IsString() @MinLength(6) @IsOptional() password?: string;
  @ApiPropertyOptional({ enum: APP_LANGS }) @IsOptional() @IsIn(APP_LANGS) preferredLang?: string;
}

export class UpdateMeDto {
  @ApiPropertyOptional() @IsEmail() @IsOptional() email?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() fullName?: string;
  @ApiPropertyOptional({ enum: APP_LANGS }) @IsOptional() @IsIn(APP_LANGS) preferredLang?: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @MinLength(6) currentPassword: string;
  @ApiProperty() @IsString() @MinLength(6) newPassword: string;
}
