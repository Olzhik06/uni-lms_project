import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './attendance.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('courses/:id/attendance')
export class AttendanceController {
  constructor(private svc: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'Get course attendance' })
  findAll(@Param('id') id: string, @CurrentUser() u: any) {
    return this.svc.findByCourse(id, u);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Mark attendance (teacher/admin)' })
  mark(@Param('id') id: string, @Body() dto: MarkAttendanceDto) {
    return this.svc.mark(id, dto);
  }
}
