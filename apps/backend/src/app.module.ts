import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { GradesModule } from './grades/grades.module';
import { ScheduleModule } from './schedule/schedule.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, GroupsModule, CoursesModule,
    EnrollmentsModule, AnnouncementsModule, AssignmentsModule, GradesModule,
    ScheduleModule, NotificationsModule],
})
export class AppModule {}
