import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './materials.dto';
import { Role, CourseRole } from '@prisma/client';

@Injectable()
export class MaterialsService {
  constructor(private db: PrismaService) {}

  findByCourse(courseId: string) {
    return this.db.courseMaterial.findMany({ where: { courseId }, orderBy: { createdAt: 'desc' } });
  }

  async create(courseId: string, dto: CreateMaterialDto, user: { id: string; role: Role }) {
    if (user.role !== Role.ADMIN) {
      const enr = await this.db.enrollment.findFirst({ where: { userId: user.id, courseId, roleInCourse: CourseRole.TEACHER } });
      if (!enr) throw new ForbiddenException('errors.material.onlyTeachersOrAdmins');
    }
    return this.db.courseMaterial.create({ data: { courseId, title: dto.title, type: dto.type, url: dto.url, content: dto.content } });
  }

  async createFromUpload(courseId: string, file: Express.Multer.File, title: string | undefined, user: { id: string; role: Role }) {
    if (user.role !== Role.ADMIN) {
      const enr = await this.db.enrollment.findFirst({ where: { userId: user.id, courseId, roleInCourse: CourseRole.TEACHER } });
      if (!enr) throw new ForbiddenException('errors.material.onlyTeachersOrAdmins');
    }
    const fileUrl = `/uploads/${file.filename}`;
    const fileName = title?.trim() || file.originalname;
    return this.db.courseMaterial.create({ data: { courseId, title: fileName, type: 'file', url: fileUrl } });
  }

  async remove(id: string, user: { id: string; role: Role }) {
    const mat = await this.db.courseMaterial.findUnique({ where: { id } });
    if (!mat) throw new NotFoundException();
    if (user.role !== Role.ADMIN) {
      const enr = await this.db.enrollment.findFirst({ where: { userId: user.id, courseId: mat.courseId, roleInCourse: CourseRole.TEACHER } });
      if (!enr) throw new ForbiddenException();
    }
    await this.db.courseMaterial.delete({ where: { id } });
    return { deleted: true };
  }
}
