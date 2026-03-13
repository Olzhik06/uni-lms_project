import { Module } from '@nestjs/common';
import { AdminController, CourseProgressController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, CourseProgressController],
  providers: [AdminService],
})
export class AdminModule {}
