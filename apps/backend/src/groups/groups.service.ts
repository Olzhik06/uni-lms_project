import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPagination, toPaginatedResult } from '../common/pagination';
import { CreateGroupDto, UpdateGroupDto } from './groups.dto';
@Injectable()
export class GroupsService {
  constructor(private db: PrismaService) {}
  async findAll(
    paginationInput?: { page?: number; limit?: number },
    filters?: { search?: string; year?: number },
  ) {
    const pagination = getPagination(paginationInput?.page, paginationInput?.limit);
    const search = filters?.search?.trim();
    const numericSearchYear = search && /^\d+$/.test(search) ? Number(search) : undefined;
    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { degree: { contains: search, mode: 'insensitive' as const } },
              ...(numericSearchYear ? [{ year: numericSearchYear }] : []),
            ],
          }
        : {}),
      ...(filters?.year ? { year: filters.year } : {}),
    };
    const baseQuery = {
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
      where,
    } as const;

    if (!pagination.usePagination) {
      return this.db.group.findMany(baseQuery);
    }

    const [items, total] = await this.db.$transaction([
      this.db.group.findMany({
        ...baseQuery,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.db.group.count({ where }),
    ]);

    return toPaginatedResult(items, pagination.page, pagination.limit, total);
  }
  async findOne(id: string) { const g = await this.db.group.findUnique({ where: { id }, include: { users: { select: { id: true, email: true, fullName: true, role: true } }, _count: { select: { users: true } } } }); if (!g) throw new NotFoundException(); return g; }
  create(dto: CreateGroupDto) { return this.db.group.create({ data: dto }); }
  async update(id: string, dto: UpdateGroupDto) { await this.findOne(id); return this.db.group.update({ where: { id }, data: dto }); }
  async remove(id: string) { await this.findOne(id); await this.db.group.delete({ where: { id } }); return { deleted: true }; }
}
