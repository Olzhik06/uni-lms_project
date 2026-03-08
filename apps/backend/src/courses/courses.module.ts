import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController, AdminCoursesController } from './courses.controller';
@Module({ controllers: [CoursesController, AdminCoursesController], providers: [CoursesService], exports: [CoursesService] })
export class CoursesModule {}
