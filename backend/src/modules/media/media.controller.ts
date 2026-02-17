import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Res,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadMediaDto: UploadMediaDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.mediaService.uploadFile(file, uploadMediaDto, req?.user);
  }

  @Post('upload/player/:playerId/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPlayerAvatar(
    @Param('playerId') playerId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.mediaService.uploadPlayerAvatar(playerId, file);
  }

  @Post('upload/club/:clubId/logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadClubLogo(@Param('clubId') clubId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.mediaService.uploadClubLogo(clubId, file);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Get('player/:playerId')
  @UseGuards(JwtAuthGuard)
  getPlayerMedia(@Param('playerId') playerId: string) {
    return this.mediaService.getPlayerMedia(playerId);
  }

  @Get('match/:matchId')
  @UseGuards(JwtAuthGuard)
  getMatchMedia(@Param('matchId') matchId: string) {
    return this.mediaService.getMatchMedia(matchId);
  }

  @Get('report/:reportId')
  @UseGuards(JwtAuthGuard)
  getReportMedia(@Param('reportId') reportId: string) {
    return this.mediaService.getReportMedia(reportId);
  }

  @Get(':id/download')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const { blob, filename, mimeType } = await this.mediaService.downloadFile(id);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const buffer = Buffer.from(await blob.arrayBuffer());
    res.send(buffer);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.mediaService.remove(id, req?.user);
  }
}
