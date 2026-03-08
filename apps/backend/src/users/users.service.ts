import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './users.dto';

const SEL = { id: true, email: true, fullName: true, role: true, groupId: true, createdAt: true, group: { select: { id: true, name: true } } };

@Injectable()
export class UsersService {
  constructor(private db: PrismaService) {}
  findAll() { return this.db.user.findMany({ select: SEL, orderBy: { createdAt: 'desc' } }); }
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
  async remove(id: string) { await this.findOne(id); await this.db.user.delete({ where: { id } }); return { deleted: true }; }
}
