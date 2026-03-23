import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('errors.auth.invalidCredentials');
    if (!(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('errors.auth.invalidCredentials');
    return this.issueTokens(user);
  }

  async register(dto: RegisterDto) {
    if (await this.prisma.user.findUnique({ where: { email: dto.email } }))
      throw new ConflictException('errors.user.emailInUse');
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash: await bcrypt.hash(dto.password, 10), fullName: dto.fullName, role: dto.role ?? Role.STUDENT },
    });
    return this.issueTokens(user);
  }

  async refresh(token: string) {
    try {
      const p = this.jwt.verify(token, { secret: process.env.JWT_REFRESH_SECRET || 'change-me-super-secret-refresh-key-at-least-32' });
      const user = await this.prisma.user.findUnique({ where: { id: p.sub } });
      if (!user) throw new UnauthorizedException();
      return this.issueTokens(user);
    } catch { throw new UnauthorizedException('errors.auth.invalidRefreshToken'); }
  }

  private issueTokens(user: { id: string; email: string; fullName: string; role: Role; preferredLang?: string | null }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRATION || '15m' }),
      refreshToken: this.jwt.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'change-me-super-secret-refresh-key-at-least-32',
        expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
      }),
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, preferredLang: user.preferredLang ?? 'en' },
    };
  }
}
