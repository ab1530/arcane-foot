import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ScoutingReportsService } from './scouting-reports.service';
import { PdfService } from './pdf.service';
import { CreateScoutingReportDto } from './dto/create-scouting-report.dto';
import { UpdateScoutingReportDto } from './dto/update-scouting-report.dto';
import { QueryScoutingReportDto } from './dto/query-scouting-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('scouting-reports')
@Controller('scouting-reports')
export class ScoutingReportsController {
  constructor(
    private readonly reportsService: ScoutingReportsService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un rapport de scouting' })
  @ApiResponse({ status: 201, description: 'Rapport créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  create(@Body() createDto: CreateScoutingReportDto, @Request() req) {
    const scoutId = req.user.id || req.user.sub;
    return this.reportsService.create(createDto, scoutId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir tous les rapports avec filtres' })
  @ApiResponse({ status: 200, description: 'Liste des rapports' })
  findAll(@Query() query: QueryScoutingReportDto) {
    return this.reportsService.findAll(query);
  }

  @Get('player/:playerId')
  @ApiOperation({ summary: "Obtenir les rapports d'un joueur" })
  @ApiResponse({ status: 200, description: 'Rapports du joueur' })
  getPlayerReports(@Param('playerId') playerId: string) {
    return this.reportsService.getPlayerReports(playerId);
  }

  @Get('scout/:scoutId')
  @ApiOperation({ summary: "Obtenir les rapports d'un scout" })
  @ApiResponse({ status: 200, description: 'Rapports du scout' })
  getScoutReports(@Param('scoutId') scoutId: string) {
    return this.reportsService.getScoutReports(scoutId);
  }

  @Get('match/:matchId')
  @ApiOperation({ summary: "Obtenir les rapports d'un match" })
  @ApiResponse({ status: 200, description: 'Rapports du match' })
  getMatchReports(@Param('matchId') matchId: string) {
    return this.reportsService.getMatchReports(matchId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Télécharger le rapport en PDF' })
  @ApiResponse({ status: 200, description: 'PDF généré' })
  @ApiResponse({ status: 404, description: 'Rapport introuvable' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generateReportPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=rapport-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un rapport par ID' })
  @ApiResponse({ status: 200, description: 'Détails du rapport' })
  @ApiResponse({ status: 404, description: 'Rapport introuvable' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un rapport' })
  @ApiResponse({ status: 200, description: 'Rapport mis à jour' })
  @ApiResponse({ status: 404, description: 'Rapport introuvable' })
  update(@Param('id') id: string, @Body() updateDto: UpdateScoutingReportDto) {
    return this.reportsService.update(id, updateDto);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soumettre un rapport pour revue' })
  @ApiResponse({ status: 200, description: 'Rapport soumis' })
  @ApiResponse({ status: 404, description: 'Rapport introuvable' })
  submit(@Param('id') id: string) {
    return this.reportsService.submit(id);
  }

  @Post(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reviewer un rapport (approuver/rejeter)' })
  @ApiResponse({ status: 200, description: 'Rapport reviewé' })
  @ApiResponse({ status: 404, description: 'Rapport introuvable' })
  review(@Param('id') id: string, @Body('approved') approved: boolean, @Request() req) {
    const reviewerId = req.user.id || req.user.sub;
    return this.reportsService.review(id, reviewerId, approved);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un rapport' })
  @ApiResponse({ status: 200, description: 'Rapport supprimé' })
  @ApiResponse({ status: 404, description: 'Rapport introuvable' })
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }
}
