import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto, UpdateAssignmentDto, SubmitDto, GradeDto } from './assignments.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

const uploadStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

@ApiTags('Assignments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class AssignmentsController {
  constructor(private svc: AssignmentsService) {}

  @Get('courses/:id/assignments')
  @ApiOperation({ summary: 'List assignments for a course' })
  @ApiOperation({ summary: 'List assignments for a course' })
  byCourse(@Param('id') id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.svc.findByCourse(id, page ? +page : 1, limit ? +limit : 20);
  }

  @Post('courses/:id/assignments')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Create assignment (teacher/admin)' })
  create(@Param('id') id: string, @Body() dto: CreateAssignmentDto, @CurrentUser() u: any) {
    return this.svc.create(id, dto, u);
  }

  @Get('assignments/:id')
  @ApiOperation({ summary: 'Get single assignment' })
  one(@Param('id') id: string) { return this.svc.findOne(id); }

  @Patch('assignments/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update assignment (teacher/admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) { return this.svc.update(id, dto); }

  @Delete('assignments/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Delete assignment (teacher/admin)' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }

  @Post('assignments/:id/submit')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Submit assignment (student)' })
  submit(@Param('id') id: string, @Body() dto: SubmitDto, @CurrentUser() u: any) {
    return this.svc.submit(id, dto, u.id);
  }

  @Post('assignments/:id/submit-file')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit assignment with file upload (student)' })
  submitFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() u: any) {
    const fileUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.svc.submit(id, { fileUrl }, u.id);
  }

  @Get('assignments/:id/submission')
  @ApiOperation({ summary: 'Get my submission' })
  mySub(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.getMySub(id, u.id); }

  @Get('assignments/:id/submissions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get all submissions for assignment (teacher/admin)' })
  allSubs(@Param('id') id: string) { return this.svc.allSubs(id); }

  @Post('submissions/:id/grade')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Grade submission (teacher/admin)' })
  grade(@Param('id') id: string, @Body() dto: GradeDto, @CurrentUser() u: any) {
    return this.svc.grade(id, dto, u.id);
  }
}
