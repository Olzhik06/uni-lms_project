import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto } from './groups.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Admin - Groups') @ApiBearerAuth() @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles(Role.ADMIN) @Controller('admin/groups')
export class GroupsController {
  constructor(private svc: GroupsService) {}
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: Number })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('year') year?: string,
  ) {
    return this.svc.findAll(
      { page: page ? +page : undefined, limit: limit ? +limit : undefined },
      { search, year: year ? +year : undefined },
    );
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() dto: CreateGroupDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateGroupDto) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id); }
}
