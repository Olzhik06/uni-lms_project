import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, CreateUserDto, UpdateMeDto, UpdateUserDto } from './users.dto';

const SEL = { id: true, email: true, fullName: true, role: true, groupId: true, createdAt: true, group: { select: { id: true, name: true } } };

@Injectable()
export class UsersService {
  constructor(private db: PrismaService) {}
  findAll(page?: number, limit?: number) {
    const usePagination = page !== undefined || limit !== undefined;
    const safePage = Math.max(page ?? 1, 1);
    const safeLimit = Math.max(limit ?? 20, 1);

    return this.db.user.findMany({
      select: SEL,
      orderBy: { createdAt: 'desc' },
      ...(usePagination ? { skip: (safePage - 1) * safeLimit, take: safeLimit } : {}),
    });
  }
  async findOne(id: string) { const u = await this.db.user.findUnique({ where: { id }, select: SEL }); if (!u) throw new NotFoundException(); return u; }
  async create(dto: CreateUserDto) {
    if (await this.db.user.findUnique({ where: { email: dto.email } })) throw new ConflictException('Email in use');
    return this.db.user.create({ data: { email: dto.email, passwordHash: await bcrypt.hash(dto.password, 10), fullName: dto.fullName, role: dto.role, groupId: dto.groupId || null }, select: SEL });
  }
  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); const d: any = { ...dto };
    if (dto.password) { d.passwordHash = await bcrypt.hash(dto.password, 10); delete d.password; }
    if (d.groupId === '') d.groupId = null;
    return this.db.user.update({ where: { id }, data: d, select: SEL });
  }
  async updateMe(id: string, dto: UpdateMeDto) {
    const existing = await this.findOne(id);
    if (dto.email && dto.email !== existing.email) {
      const sameEmail = await this.db.user.findUnique({ where: { email: dto.email } });
      if (sameEmail && sameEmail.id !== id) throw new ConflictException('Email in use');
    }
    return this.db.user.update({
      where: { id },
      data: {
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
      },
      select: SEL,
    });
  }
  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.db.user.findUnique({
      where: { id },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new NotFoundException();
    if (!user.passwordHash || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.db.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { updated: true };
  }
  async remove(id: string) { await this.findOne(id); await this.db.user.delete({ where: { id } }); return { deleted: true }; }
}
