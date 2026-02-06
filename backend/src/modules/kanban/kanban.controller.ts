import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { KanbanService } from './kanban.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('kanban')
@Controller('kanban')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  // =======================================
  // BOARDS
  // =======================================

  @Post('boards')
  @ApiOperation({ summary: 'Créer un nouveau tableau Kanban' })
  @ApiResponse({ status: 201, description: 'Tableau créé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  createBoard(@Body() createBoardDto: CreateBoardDto, @Request() req) {
    return this.kanbanService.createBoard(createBoardDto, req.user.sub);
  }

  @Get('boards')
  @ApiOperation({ summary: 'Obtenir tous les tableaux Kanban' })
  @ApiResponse({ status: 200, description: 'Liste des tableaux' })
  getAllBoards() {
    return this.kanbanService.getAllBoards();
  }

  @Get('boards/:id')
  @ApiOperation({ summary: 'Obtenir un tableau par ID' })
  @ApiResponse({ status: 200, description: 'Détails du tableau' })
  @ApiResponse({ status: 404, description: 'Tableau introuvable' })
  getBoard(@Param('id') id: string) {
    return this.kanbanService.getBoard(id);
  }

  @Patch('boards/:id')
  @ApiOperation({ summary: 'Mettre à jour un tableau' })
  @ApiResponse({ status: 200, description: 'Tableau mis à jour' })
  @ApiResponse({ status: 404, description: 'Tableau introuvable' })
  updateBoard(@Param('id') id: string, @Body() updateData: Partial<CreateBoardDto>) {
    return this.kanbanService.updateBoard(id, updateData);
  }

  @Delete('boards/:id')
  @ApiOperation({ summary: 'Supprimer un tableau' })
  @ApiResponse({ status: 200, description: 'Tableau supprimé' })
  @ApiResponse({ status: 404, description: 'Tableau introuvable' })
  deleteBoard(@Param('id') id: string) {
    return this.kanbanService.deleteBoard(id);
  }

  // =======================================
  // COLUMNS
  // =======================================

  @Post('boards/:boardId/columns')
  @ApiOperation({ summary: 'Créer une nouvelle colonne' })
  @ApiResponse({ status: 201, description: 'Colonne créée avec succès' })
  @ApiResponse({ status: 404, description: 'Tableau introuvable' })
  createColumn(@Param('boardId') boardId: string, @Body() createColumnDto: CreateColumnDto) {
    return this.kanbanService.createColumn(boardId, createColumnDto);
  }

  @Patch('columns/:id')
  @ApiOperation({ summary: 'Mettre à jour une colonne' })
  @ApiResponse({ status: 200, description: 'Colonne mise à jour' })
  @ApiResponse({ status: 404, description: 'Colonne introuvable' })
  updateColumn(@Param('id') id: string, @Body() updateData: Partial<CreateColumnDto>) {
    return this.kanbanService.updateColumn(id, updateData);
  }

  @Delete('columns/:id')
  @ApiOperation({ summary: 'Supprimer une colonne' })
  @ApiResponse({ status: 200, description: 'Colonne supprimée' })
  @ApiResponse({ status: 400, description: 'Colonne contient des cartes' })
  @ApiResponse({ status: 404, description: 'Colonne introuvable' })
  deleteColumn(@Param('id') id: string) {
    return this.kanbanService.deleteColumn(id);
  }

  // =======================================
  // CARDS
  // =======================================

  @Post('cards')
  @ApiOperation({ summary: 'Créer une nouvelle carte' })
  @ApiResponse({ status: 201, description: 'Carte créée avec succès' })
  @ApiResponse({ status: 404, description: 'Colonne ou joueur introuvable' })
  @ApiResponse({ status: 409, description: 'Joueur déjà présent dans cette colonne' })
  createCard(@Body() createCardDto: CreateCardDto) {
    return this.kanbanService.createCard(createCardDto);
  }

  @Get('cards/:id')
  @ApiOperation({ summary: 'Obtenir une carte par ID' })
  @ApiResponse({ status: 200, description: 'Détails de la carte' })
  @ApiResponse({ status: 404, description: 'Carte introuvable' })
  getCard(@Param('id') id: string) {
    return this.kanbanService.getCard(id);
  }

  @Patch('cards/:id')
  @ApiOperation({ summary: 'Mettre à jour une carte' })
  @ApiResponse({ status: 200, description: 'Carte mise à jour' })
  @ApiResponse({ status: 404, description: 'Carte introuvable' })
  updateCard(@Param('id') id: string, @Body() updateData: Partial<CreateCardDto>) {
    return this.kanbanService.updateCard(id, updateData);
  }

  @Post('cards/:id/move')
  @ApiOperation({ summary: 'Déplacer une carte vers une autre colonne' })
  @ApiResponse({ status: 200, description: 'Carte déplacée avec succès' })
  @ApiResponse({ status: 404, description: 'Carte ou colonne introuvable' })
  @ApiResponse({ status: 400, description: 'Limite de cartes atteinte' })
  moveCard(@Param('id') id: string, @Body() moveCardDto: MoveCardDto) {
    return this.kanbanService.moveCard(id, moveCardDto);
  }

  @Delete('cards/:id')
  @ApiOperation({ summary: 'Supprimer une carte' })
  @ApiResponse({ status: 200, description: 'Carte supprimée' })
  @ApiResponse({ status: 404, description: 'Carte introuvable' })
  deleteCard(@Param('id') id: string) {
    return this.kanbanService.deleteCard(id);
  }

  @Get('cards/:id/activities')
  @ApiOperation({ summary: "Obtenir l'historique des activités d'une carte" })
  @ApiResponse({ status: 200, description: 'Liste des activités' })
  getCardActivities(@Param('id') id: string) {
    return this.kanbanService.getCardActivities(id);
  }
}
