import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController, AdminCoursesController } from './courses.controller';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [ActivityLogModule],
  controllers: [CoursesController, AdminCoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
