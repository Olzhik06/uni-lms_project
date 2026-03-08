import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './enrollments.dto';
@Injectable()
export class EnrollmentsService {
  constructor(private db: PrismaService) {}
  findAll() { return this.db.enrollment.findMany({ include: { user: { select: { id: true, email: true, fullName: true, role: true } }, course: { select: { id: true, code: true, title: true } } }, orderBy: { createdAt: 'desc' } }); }
  async create(dto: CreateEnrollmentDto) {
    try { return await this.db.enrollment.create({ data: dto, include: { user: { select: { id: true, email: true, fullName: true } }, course: { select: { id: true, code: true, title: true } } } }); }
    catch (e: any) { if (e.code === 'P2002') throw new ConflictException('Already enrolled'); throw e; }
  }
  async remove(id: string) { if (!(await this.db.enrollment.findUnique({ where: { id } }))) throw new NotFoundException(); await this.db.enrollment.delete({ where: { id } }); return { deleted: true }; }
}
