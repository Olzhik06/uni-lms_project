import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './groups.dto';
@Injectable()
export class GroupsService {
  constructor(private db: PrismaService) {}
  findAll(page?: number, limit?: number) {
    const usePagination = page !== undefined || limit !== undefined;
    const safePage = Math.max(page ?? 1, 1);
    const safeLimit = Math.max(limit ?? 20, 1);

    return this.db.group.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
      ...(usePagination ? { skip: (safePage - 1) * safeLimit, take: safeLimit } : {}),
    });
  }
  async findOne(id: string) { const g = await this.db.group.findUnique({ where: { id }, include: { users: { select: { id: true, email: true, fullName: true, role: true } }, _count: { select: { users: true } } } }); if (!g) throw new NotFoundException(); return g; }
  create(dto: CreateGroupDto) { return this.db.group.create({ data: dto }); }
  async update(id: string, dto: UpdateGroupDto) { await this.findOne(id); return this.db.group.update({ where: { id }, data: dto }); }
  async remove(id: string) { await this.findOne(id); await this.db.group.delete({ where: { id } }); return { deleted: true }; }
}
