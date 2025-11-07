import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { PrismaService } from '../prisma/prisma.service';

describe('KanbanService', () => {
  let service: KanbanService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    kanban_boards: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    kanban_columns: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    kanban_cards: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    kanban_card_activities: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    players: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KanbanService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<KanbanService>(KanbanService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBoard', () => {
    const createBoardDto = {
      name: 'Market Board',
      description: 'Player transfer market',
      isPublic: false,
    };

    const mockBoard = {
      id: 'board-123',
      ...createBoardDto,
      ownerId: 'user-123',
      columns: [],
    };

    it('should create a private board with ownerId', async () => {
      mockPrismaService.kanban_boards.create.mockResolvedValue(mockBoard);

      const result = await service.createBoard(createBoardDto, 'user-123');

      expect(prismaService.kanban_boards.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ...createBoardDto,
            ownerId: 'user-123',
          }),
          include: expect.any(Object),
        }),
      );
      expect(result).toEqual(mockBoard);
    });

    it('should create a public board with null ownerId', async () => {
      const publicBoardDto = { ...createBoardDto, isPublic: true };
      const publicBoard = { ...mockBoard, isPublic: true, ownerId: null };
      mockPrismaService.kanban_boards.create.mockResolvedValue(publicBoard);

      await service.createBoard(publicBoardDto, 'user-123');

      expect(prismaService.kanban_boards.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ...publicBoardDto,
            ownerId: null,
          }),
          include: expect.any(Object),
        }),
      );
    });
  });

  describe('getAllBoards', () => {
    const mockBoards = [
      {
        id: 'board-1',
        name: 'Board 1',
        columns: [
          { id: 'col-1', _count: { cards: 5 } },
        ],
      },
      {
        id: 'board-2',
        name: 'Board 2',
        columns: [],
      },
    ];

    it('should return all boards ordered by createdAt desc', async () => {
      mockPrismaService.kanban_boards.findMany.mockResolvedValue(mockBoards);

      const result = await service.getAllBoards();

      expect(prismaService.kanban_boards.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toEqual(mockBoards);
    });

    it('should include columns with card counts', async () => {
      mockPrismaService.kanban_boards.findMany.mockResolvedValue(mockBoards);

      await service.getAllBoards();

      expect(prismaService.kanban_boards.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            kanban_columns: expect.objectContaining({
              include: expect.objectContaining({
                _count: expect.objectContaining({
                  select: { kanban_cards: true },
                }),
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('getBoard', () => {
    const mockBoard = {
      id: 'board-123',
      name: 'Test Board',
      columns: [
        {
          id: 'col-1',
          cards: [
            {
              id: 'card-1',
              player: {
                user: { firstName: 'John', lastName: 'Doe' },
              },
              activities: [],
            },
          ],
        },
      ],
    };

    it('should return a board by ID with nested includes', async () => {
      mockPrismaService.kanban_boards.findUnique.mockResolvedValue(mockBoard);

      const result = await service.getBoard('board-123');

      expect(prismaService.kanban_boards.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockBoard);
    });

    it('should throw NotFoundException if board not found', async () => {
      mockPrismaService.kanban_boards.findUnique.mockResolvedValue(null);

      await expect(service.getBoard('invalid-id')).rejects.toThrow(
        new NotFoundException(`Tableau Kanban avec l'ID invalid-id introuvable`),
      );
    });
  });

  describe('updateBoard', () => {
    const mockBoard = {
      id: 'board-123',
      name: 'Test Board',
      columns: [],
    };

    const updateData = {
      name: 'Updated Board',
      description: 'New description',
    };

    it('should update a board successfully', async () => {
      mockPrismaService.kanban_boards.findUnique.mockResolvedValue(mockBoard);
      mockPrismaService.kanban_boards.update.mockResolvedValue({
        ...mockBoard,
        ...updateData,
      });

      const result = await service.updateBoard('board-123', updateData);

      expect(prismaService.kanban_boards.findUnique).toHaveBeenCalled();
      expect(prismaService.kanban_boards.update).toHaveBeenCalledWith({
        where: { id: 'board-123' },
        data: updateData,
        include: expect.any(Object),
      });
      expect(result.name).toBe(updateData.name);
    });

    it('should throw NotFoundException if board not found', async () => {
      mockPrismaService.kanban_boards.findUnique.mockResolvedValue(null);

      await expect(
        service.updateBoard('invalid-id', updateData),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBoard', () => {
    const mockBoard = {
      id: 'board-123',
      name: 'Test Board',
      columns: [],
    };

    it('should delete a board successfully', async () => {
      mockPrismaService.kanban_boards.findUnique.mockResolvedValue(mockBoard);
      mockPrismaService.kanban_boards.delete.mockResolvedValue(mockBoard);

      const result = await service.deleteBoard('board-123');

      expect(prismaService.kanban_boards.delete).toHaveBeenCalledWith({
        where: { id: 'board-123' },
      });
      expect(result).toEqual({ message: 'Tableau supprimé avec succès' });
    });

    it('should throw NotFoundException if board not found', async () => {
      mockPrismaService.kanban_boards.findUnique.mockResolvedValue(null);

      await expect(service.deleteBoard('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createColumn', () => {
    const createColumnDto = {
      name: 'To Scout',
      color: '#3B82F6',
      type: 'CUSTOM' as any,
      position: 0,
    };

    const mockBoard = {
      id: 'board-123',
      name: 'Test Board',
      columns: [],
    };

    const mockColumn = {
      id: 'col-123',
      ...createColumnDto,
      boardId: 'board-123',
      cards: [],
    };

    it('should create a column successfully', async () => {
      mockPrismaService.kanban_boards.findUnique.mockResolvedValue(mockBoard);
      mockPrismaService.kanban_columns.create.mockResolvedValue(mockColumn);

      const result = await service.createColumn('board-123', createColumnDto);

      expect(prismaService.kanban_boards.findUnique).toHaveBeenCalled();
      expect(prismaService.kanban_columns.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: createColumnDto.name,
            color: createColumnDto.color,
            type: createColumnDto.type,
            position: createColumnDto.position,
            boardId: 'board-123',
          }),
          include: { kanban_cards: true },
        }),
      );
      expect(result).toEqual(mockColumn);
    });

    it('should throw NotFoundException if board not found', async () => {
      mockPrismaService.kanban_boards.findUnique.mockResolvedValue(null);

      await expect(
        service.createColumn('invalid-id', createColumnDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateColumn', () => {
    const mockColumn = {
      id: 'col-123',
      name: 'To Scout',
      cards: [],
    };

    const updateData = {
      name: 'Scouting',
      color: '#10B981',
    };

    it('should update a column successfully', async () => {
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.kanban_columns.update.mockResolvedValue({
        ...mockColumn,
        ...updateData,
      });

      const result = await service.updateColumn('col-123', updateData);

      expect(prismaService.kanban_columns.update).toHaveBeenCalledWith({
        where: { id: 'col-123' },
        data: updateData,
        include: { kanban_cards: true },
      });
      expect(result.name).toBe(updateData.name);
    });

    it('should throw NotFoundException if column not found', async () => {
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(null);

      await expect(
        service.updateColumn('invalid-id', updateData),
      ).rejects.toThrow(
        new NotFoundException(`Colonne avec l'ID invalid-id introuvable`),
      );
    });
  });

  describe('deleteColumn', () => {
    const mockEmptyColumn = {
      id: 'col-123',
      name: 'Empty Column',
      _count: { kanban_cards: 0 },
    };

    const mockColumnWithCards = {
      id: 'col-456',
      name: 'Column with Cards',
      _count: { kanban_cards: 5 },
    };

    it('should delete an empty column successfully', async () => {
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(mockEmptyColumn);
      mockPrismaService.kanban_columns.delete.mockResolvedValue(mockEmptyColumn);

      const result = await service.deleteColumn('col-123');

      expect(prismaService.kanban_columns.delete).toHaveBeenCalledWith({
        where: { id: 'col-123' },
      });
      expect(result).toEqual({ message: 'Colonne supprimée avec succès' });
    });

    it('should throw BadRequestException if column has cards', async () => {
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(mockColumnWithCards);

      await expect(service.deleteColumn('col-456')).rejects.toThrow(
        new BadRequestException(
          `Impossible de supprimer une colonne contenant 5 carte(s). Déplacez ou supprimez d'abord les cartes.`,
        ),
      );
      expect(prismaService.kanban_columns.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if column not found', async () => {
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(null);

      await expect(service.deleteColumn('invalid-id')).rejects.toThrow(
        new NotFoundException(`Colonne avec l'ID invalid-id introuvable`),
      );
    });
  });

  describe('createCard', () => {
    const createCardDto = {
      columnId: 'col-123',
      playerId: 'player-123',
      notes: 'Promising young talent',
      priority: 'HIGH' as any,
      tags: ['striker', 'french'],
    };

    const mockColumn = {
      id: 'col-123',
      name: 'To Scout',
      kanban_cards: [],
      cardLimit: null,
    };

    const mockPlayer = {
      id: 'player-123',
      user: { firstName: 'John', lastName: 'Doe' },
    };

    const mockCard = {
      id: 'card-123',
      ...createCardDto,
      position: 0,
      player: mockPlayer,
      column: mockColumn,
    };

    beforeEach(() => {
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.players.findUnique.mockResolvedValue(mockPlayer);
      mockPrismaService.kanban_cards.findUnique.mockResolvedValue(null);
      mockPrismaService.kanban_cards.create.mockResolvedValue(mockCard);
      mockPrismaService.kanban_card_activities.create.mockResolvedValue({});
    });

    it('should create a card successfully', async () => {
      const result = await service.createCard(createCardDto);

      expect(prismaService.kanban_columns.findUnique).toHaveBeenCalled();
      expect(prismaService.players.findUnique).toHaveBeenCalled();
      expect(prismaService.kanban_cards.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          columnId: createCardDto.columnId,
          playerId: createCardDto.playerId,
          notes: createCardDto.notes,
          priority: createCardDto.priority,
          tags: createCardDto.tags,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCard);
    });

    it('should create activity log when card is created', async () => {
      await service.createCard(createCardDto);

      expect(prismaService.kanban_card_activities.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cardId: mockCard.id,
          action: 'created',
          toColumnId: createCardDto.columnId,
        }),
      });
    });

    it('should throw NotFoundException if column not found', async () => {
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(null);

      await expect(service.createCard(createCardDto)).rejects.toThrow(
        new NotFoundException(`Colonne avec l'ID ${createCardDto.columnId} introuvable`),
      );
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPrismaService.players.findUnique.mockResolvedValue(null);

      await expect(service.createCard(createCardDto)).rejects.toThrow(
        new NotFoundException(`Joueur avec l'ID ${createCardDto.playerId} introuvable`),
      );
    });

    it('should throw BadRequestException if column reached card limit', async () => {
      const limitedColumn = {
        ...mockColumn,
        cardLimit: 5,
        kanban_cards: Array.from({ length: 5 }, (_, i) => ({ id: `card-${i}` })),
      };
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(limitedColumn);

      await expect(service.createCard(createCardDto)).rejects.toThrow(
        new BadRequestException(
          `La colonne "To Scout" a atteint sa limite de 5 cartes`,
        ),
      );
    });

    it('should throw ConflictException if player already in column', async () => {
      mockPrismaService.kanban_cards.findUnique.mockResolvedValue({ id: 'existing-card' });

      await expect(service.createCard(createCardDto)).rejects.toThrow(
        new ConflictException(
          `Le joueur est déjà présent dans la colonne "To Scout"`,
        ),
      );
    });

    it('should set position to end of column if not specified', async () => {
      const columnWithCards = {
        ...mockColumn,
        kanban_cards: [{ id: 'card-1' }, { id: 'card-2' }],
      };
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(columnWithCards);

      await service.createCard(createCardDto);

      expect(prismaService.kanban_cards.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          position: expect.any(Number),
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('getCard', () => {
    const mockCard = {
      id: 'card-123',
      player: {
        user: { firstName: 'John' },
        scoutingReports: [],
      },
      column: {
        board: { name: 'Market Board' },
      },
      activities: [],
    };

    it('should return a card by ID with nested includes', async () => {
      mockPrismaService.kanban_cards.findUnique.mockResolvedValue(mockCard);

      const result = await service.getCard('card-123');

      expect(prismaService.kanban_cards.findUnique).toHaveBeenCalledWith({
        where: { id: 'card-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCard);
    });

    it('should throw NotFoundException if card not found', async () => {
      mockPrismaService.kanban_cards.findUnique.mockResolvedValue(null);

      await expect(service.getCard('invalid-id')).rejects.toThrow(
        new NotFoundException(`Carte avec l'ID invalid-id introuvable`),
      );
    });
  });

  describe('updateCard', () => {
    const mockCard = {
      id: 'card-123',
      notes: 'Old notes',
      player: { user: { firstName: 'John' } },
      column: { name: 'To Scout' },
    };

    const updateData = {
      notes: 'Updated notes',
      priority: 'HIGH' as any,
      tags: ['striker'],
    };

    beforeEach(() => {
      mockPrismaService.kanban_cards.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.kanban_cards.update.mockResolvedValue({
        ...mockCard,
        ...updateData,
      });
      mockPrismaService.kanban_card_activities.create.mockResolvedValue({});
    });

    it('should update a card successfully', async () => {
      const result = await service.updateCard('card-123', updateData);

      expect(prismaService.kanban_cards.update).toHaveBeenCalledWith({
        where: { id: 'card-123' },
        data: expect.objectContaining(updateData),
        include: expect.any(Object),
      });
      expect(result.notes).toBe(updateData.notes);
    });

    it('should create activity log when card is updated', async () => {
      await service.updateCard('card-123', updateData);

      expect(prismaService.kanban_card_activities.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cardId: 'card-123',
          action: 'updated',
          description: 'Carte mise à jour',
          metadata: updateData,
        }),
      });
    });

    it('should throw NotFoundException if card not found', async () => {
      mockPrismaService.kanban_cards.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCard('invalid-id', updateData),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('moveCard', () => {
    const mockCard = {
      id: 'card-123',
      columnId: 'col-source',
      player: { user: { firstName: 'John' } },
      column: { name: 'Source Column' },
    };

    const mockTargetColumn = {
      id: 'col-target',
      name: 'Target Column',
      kanban_cards: [{ id: 'card-1' }],
      cardLimit: null,
    };

    const moveCardDto = {
      targetColumnId: 'col-target',
      position: 1,
    };

    beforeEach(() => {
      mockPrismaService.kanban_cards.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(mockTargetColumn);
      mockPrismaService.kanban_cards.update.mockResolvedValue({
        ...mockCard,
        columnId: moveCardDto.targetColumnId,
      });
      mockPrismaService.kanban_card_activities.create.mockResolvedValue({});
    });

    it('should move a card to target column', async () => {
      const result = await service.moveCard('card-123', moveCardDto);

      expect(prismaService.kanban_cards.update).toHaveBeenCalledWith({
        where: { id: 'card-123' },
        data: expect.objectContaining({
          columnId: moveCardDto.targetColumnId,
          position: moveCardDto.position,
          movedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
      expect(result.columnId).toBe(moveCardDto.targetColumnId);
    });

    it('should create activity log when card is moved', async () => {
      await service.moveCard('card-123', moveCardDto);

      expect(prismaService.kanban_card_activities.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cardId: 'card-123',
          action: 'moved',
          fromColumnId: 'col-source',
          toColumnId: 'col-target',
        }),
      });
    });

    it('should throw NotFoundException if target column not found', async () => {
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(null);

      await expect(
        service.moveCard('card-123', moveCardDto),
      ).rejects.toThrow(
        new NotFoundException(`Colonne de destination avec l'ID ${moveCardDto.targetColumnId} introuvable`),
      );
    });

    it('should throw BadRequestException if target column reached limit', async () => {
      const limitedColumn = {
        ...mockTargetColumn,
        cardLimit: 1,
        kanban_cards: Array.from({ length: 1 }, (_, i) => ({ id: `card-${i}` })),
      };
      mockPrismaService.kanban_columns.findUnique.mockResolvedValue(limitedColumn);

      await expect(
        service.moveCard('card-123', moveCardDto),
      ).rejects.toThrow(
        new BadRequestException(
          `La colonne "Target Column" a atteint sa limite de 1 cartes`,
        ),
      );
    });

    it('should use column length as position if not specified', async () => {
      const dtoWithoutPosition = { targetColumnId: 'col-target' };

      await service.moveCard('card-123', dtoWithoutPosition);

      expect(prismaService.kanban_cards.update).toHaveBeenCalledWith({
        where: { id: 'card-123' },
        data: expect.objectContaining({
          position: expect.any(Number),
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('deleteCard', () => {
    const mockCard = {
      id: 'card-123',
      player: { user: { firstName: 'John' } },
      column: { board: { name: 'Board' } },
      activities: [],
    };

    it('should delete a card successfully', async () => {
      mockPrismaService.kanban_cards.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.kanban_cards.delete.mockResolvedValue(mockCard);

      const result = await service.deleteCard('card-123');

      expect(prismaService.kanban_cards.delete).toHaveBeenCalledWith({
        where: { id: 'card-123' },
      });
      expect(result).toEqual({ message: 'Carte supprimée avec succès' });
    });

    it('should throw NotFoundException if card not found', async () => {
      mockPrismaService.kanban_cards.findUnique.mockResolvedValue(null);

      await expect(service.deleteCard('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCardActivities', () => {
    const mockActivities = [
      {
        id: 'activity-1',
        cardId: 'card-123',
        action: 'created',
        description: 'Card created',
        createdAt: new Date(),
      },
      {
        id: 'activity-2',
        cardId: 'card-123',
        action: 'moved',
        description: 'Card moved',
        createdAt: new Date(),
      },
    ];

    it('should return card activities ordered by createdAt desc', async () => {
      mockPrismaService.kanban_card_activities.findMany.mockResolvedValue(mockActivities);

      const result = await service.getCardActivities('card-123');

      expect(prismaService.kanban_card_activities.findMany).toHaveBeenCalledWith({
        where: { cardId: 'card-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockActivities);
    });
  });
});
