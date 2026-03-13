import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './materials.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Materials')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class MaterialsController {
  constructor(private svc: MaterialsService) {}

  @Get('courses/:id/materials')
  @ApiOperation({ summary: 'Get course materials' })
  findAll(@Param('id') id: string) { return this.svc.findByCourse(id); }

  @Post('courses/:id/materials')
  @ApiOperation({ summary: 'Add course material (teacher/admin)' })
  create(@Param('id') id: string, @Body() dto: CreateMaterialDto, @CurrentUser() u: any) {
    return this.svc.create(id, dto, u);
  }

  @Delete('materials/:id')
  @ApiOperation({ summary: 'Delete course material (teacher/admin)' })
  remove(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.remove(id, u); }
}
