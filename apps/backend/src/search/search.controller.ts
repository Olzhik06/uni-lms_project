import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('search')
export class SearchController {
  constructor(private svc: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search courses, materials and assignments' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 chars)' })
  search(@Query('q') q: string, @CurrentUser() u: any) {
    return this.svc.search(q, u.id, u.role);
  }
}
