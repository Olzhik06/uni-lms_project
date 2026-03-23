import { Controller, Get, Post, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './materials.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB for materials (slides, videos)

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'audio/mpeg',
];

const mimeFilter = (_req: any, file: Express.Multer.File, cb: (e: Error | null, accept: boolean) => void) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException(`File type "${file.mimetype}" is not allowed`), false);
  }
};

const uploadStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

const uploadOptions = { storage: uploadStorage, limits: { fileSize: MAX_FILE_SIZE }, fileFilter: mimeFilter };

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

  @Post('courses/:id/materials/upload')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file as course material (teacher/admin)' })
  uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string },
    @CurrentUser() u: any,
  ) {
    return this.svc.createFromUpload(id, file, body.title, u);
  }

  @Delete('materials/:id')
  @ApiOperation({ summary: 'Delete course material (teacher/admin)' })
  remove(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.remove(id, u); }
}
