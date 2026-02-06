import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { MoveCardDto } from './dto/move-card.dto';

@Injectable()
export class KanbanService {
  constructor(private prisma: PrismaService) {}

  // =======================================
  // BOARDS
  // =======================================

  async createBoard(createBoardDto: CreateBoardDto, userId: string) {
    const board = await this.prisma.kanban_boards.create({
      data: {
        id: randomUUID(),
        ...createBoardDto,
        ownerId: createBoardDto.isPublic ? null : userId,
        updatedAt: new Date(),
      },
      include: {
        kanban_columns: {
          include: {
            kanban_cards: {
              include: {
                players: {
                  include: {
                    users: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    return board;
  }

  async getAllBoards() {
    const boards = await this.prisma.kanban_boards.findMany({
      include: {
        kanban_columns: {
          include: {
            _count: {
              select: {
                kanban_cards: true,
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return boards;
  }

  async getBoard(id: string) {
    const board = await this.prisma.kanban_boards.findUnique({
      where: { id },
      include: {
        kanban_columns: {
          include: {
            kanban_cards: {
              include: {
                players: {
                  include: {
                    users: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
                kanban_card_activities: {
                  take: 5,
                  orderBy: {
                    createdAt: 'desc',
                  },
                },
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Tableau Kanban avec l'ID ${id} introuvable`);
    }

    return board;
  }

  async updateBoard(id: string, updateData: Partial<CreateBoardDto>) {
    await this.getBoard(id);

    const updated = await this.prisma.kanban_boards.update({
      where: { id },
      data: updateData,
      include: {
        kanban_columns: {
          include: {
            kanban_cards: {
              include: {
                players: {
                  include: {
                    users: true,
                  },
                },
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    return updated;
  }

  async deleteBoard(id: string) {
    await this.getBoard(id);

    await this.prisma.kanban_boards.delete({
      where: { id },
    });

    return { message: 'Tableau supprimé avec succès' };
  }

  // =======================================
  // COLUMNS
  // =======================================

  async createColumn(boardId: string, createColumnDto: CreateColumnDto) {
    // Vérifier que le board existe
    await this.getBoard(boardId);

    const column = await this.prisma.kanban_columns.create({
      data: {
        id: randomUUID(),
        ...createColumnDto,
        boardId,
        updatedAt: new Date(),
      },
      include: {
        kanban_cards: true,
      },
    });

    return column;
  }

  async updateColumn(id: string, updateData: Partial<CreateColumnDto>) {
    const column = await this.prisma.kanban_columns.findUnique({
      where: { id },
    });

    if (!column) {
      throw new NotFoundException(`Colonne avec l'ID ${id} introuvable`);
    }

    const updated = await this.prisma.kanban_columns.update({
      where: { id },
      data: updateData,
      include: {
        kanban_cards: true,
      },
    });

    return updated;
  }

  async deleteColumn(id: string) {
    const column = await this.prisma.kanban_columns.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            kanban_cards: true,
          },
        },
      },
    });

    if (!column) {
      throw new NotFoundException(`Colonne avec l'ID ${id} introuvable`);
    }

    if (column._count.kanban_cards > 0) {
      throw new BadRequestException(
        `Impossible de supprimer une colonne contenant ${column._count.kanban_cards} carte(s). Déplacez ou supprimez d'abord les cartes.`,
      );
    }

    await this.prisma.kanban_columns.delete({
      where: { id },
    });

    return { message: 'Colonne supprimée avec succès' };
  }

  // =======================================
  // CARDS
  // =======================================

  async createCard(createCardDto: CreateCardDto) {
    // Vérifier que la colonne existe
    const column = await this.prisma.kanban_columns.findUnique({
      where: { id: createCardDto.columnId },
      include: {
        kanban_cards: true,
      },
    });

    if (!column) {
      throw new NotFoundException(`Colonne avec l'ID ${createCardDto.columnId} introuvable`);
    }

    // Vérifier la limite de cartes
    if (column.cardLimit && column.kanban_cards.length >= column.cardLimit) {
      throw new BadRequestException(
        `La colonne "${column.name}" a atteint sa limite de ${column.cardLimit} cartes`,
      );
    }

    // Vérifier que le joueur existe
    const player = await this.prisma.players.findUnique({
      where: { id: createCardDto.playerId },
    });

    if (!player) {
      throw new NotFoundException(`Joueur avec l'ID ${createCardDto.playerId} introuvable`);
    }

    // Vérifier que le joueur n'est pas déjà dans cette colonne
    const existingCard = await this.prisma.kanban_cards.findUnique({
      where: {
        columnId_playerId: {
          columnId: createCardDto.columnId,
          playerId: createCardDto.playerId,
        },
      },
    });

    if (existingCard) {
      throw new ConflictException(`Le joueur est déjà présent dans la colonne "${column.name}"`);
    }

    // Définir la position (à la fin si non spécifiée)
    const position = createCardDto.position ?? column.kanban_cards.length;

    const card = await this.prisma.kanban_cards.create({
      data: {
        id: randomUUID(),
        columnId: createCardDto.columnId,
        playerId: createCardDto.playerId,
        notes: createCardDto.notes,
        priority: createCardDto.priority,
        tags: createCardDto.tags || [],
        dueDate: createCardDto.dueDate,
        reminderDate: createCardDto.reminderDate,
        position,
        updatedAt: new Date(),
      },
      include: {
        players: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        kanban_columns: true,
      },
    });

    // Créer une activité
    await this.prisma.kanban_card_activities.create({
      data: {
        id: randomUUID(),
        cardId: card.id,
        action: 'created',
        toColumnId: createCardDto.columnId,
        description: `Carte créée dans la colonne "${column.name}"`,
      },
    });

    return card;
  }

  async getCard(id: string) {
    const card = await this.prisma.kanban_cards.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            users: true,
            scouting_reports: {
              take: 5,
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        kanban_columns: {
          include: {
            kanban_boards: true,
          },
        },
        kanban_card_activities: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException(`Carte avec l'ID ${id} introuvable`);
    }

    return card;
  }

  async updateCard(id: string, updateData: Partial<CreateCardDto>) {
    await this.getCard(id);

    const updated = await this.prisma.kanban_cards.update({
      where: { id },
      data: {
        notes: updateData.notes,
        priority: updateData.priority,
        tags: updateData.tags,
        dueDate: updateData.dueDate,
        reminderDate: updateData.reminderDate,
      },
      include: {
        players: {
          include: {
            users: true,
          },
        },
        kanban_columns: true,
      },
    });

    // Créer une activité
    await this.prisma.kanban_card_activities.create({
      data: {
        id: randomUUID(),
        cardId: id,
        action: 'updated',
        description: 'Carte mise à jour',
        metadata: updateData,
      },
    });

    return updated;
  }

  async moveCard(id: string, moveCardDto: MoveCardDto) {
    const card = await this.getCard(id);

    // Vérifier que la colonne de destination existe
    const targetColumn = await this.prisma.kanban_columns.findUnique({
      where: { id: moveCardDto.targetColumnId },
      include: {
        kanban_cards: true,
      },
    });

    if (!targetColumn) {
      throw new NotFoundException(
        `Colonne de destination avec l'ID ${moveCardDto.targetColumnId} introuvable`,
      );
    }

    // Vérifier la limite de cartes
    if (
      targetColumn.cardLimit &&
      targetColumn.kanban_cards.length >= targetColumn.cardLimit &&
      card.columnId !== moveCardDto.targetColumnId
    ) {
      throw new BadRequestException(
        `La colonne "${targetColumn.name}" a atteint sa limite de ${targetColumn.cardLimit} cartes`,
      );
    }

    const fromColumnId = card.columnId;
    const position = moveCardDto.position ?? targetColumn.kanban_cards.length;

    const updated = await this.prisma.kanban_cards.update({
      where: { id },
      data: {
        columnId: moveCardDto.targetColumnId,
        position,
        movedAt: new Date(),
      },
      include: {
        players: {
          include: {
            users: true,
          },
        },
        kanban_columns: true,
      },
    });

    // Créer une activité
    await this.prisma.kanban_card_activities.create({
      data: {
        id: randomUUID(),
        cardId: id,
        action: 'moved',
        fromColumnId,
        toColumnId: moveCardDto.targetColumnId,
        description: `Carte déplacée vers "${targetColumn.name}"`,
      },
    });

    return updated;
  }

  async deleteCard(id: string) {
    await this.getCard(id);

    await this.prisma.kanban_cards.delete({
      where: { id },
    });

    return { message: 'Carte supprimée avec succès' };
  }

  // =======================================
  // ACTIVITÉS
  // =======================================

  async getCardActivities(cardId: string) {
    const activities = await this.prisma.kanban_card_activities.findMany({
      where: { cardId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return activities;
  }
}
