import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AgentRequestsService } from './agent-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('AgentRequestsService', () => {
  let service: AgentRequestsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentRequestsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AgentRequestsService>(AgentRequestsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates an agent request', async () => {
    prisma.tasks.create.mockResolvedValue({
      id: 'task-1',
      title: 'Test demande',
      description: JSON.stringify({
        kind: 'AGENT_REQUEST',
        category: 'EQUIPMENT',
        details: 'Lui faut une ceinture',
      }),
      status: 'TODO',
      priority: 'LOW',
      creatorId: 'user-1',
      assigneeId: null,
      dueDate: null,
      createdAt: new Date('2026-02-20T10:00:00.000Z'),
      updatedAt: new Date('2026-02-20T10:00:00.000Z'),
      users_tasks_creatorIdTousers: { id: 'user-1', firstName: 'Ana', lastName: 'Test' },
      users_tasks_assigneeIdTousers: null,
    } as any);

    const result = await service.createRequest(
      {
        title: 'Test demande',
        category: 'EQUIPMENT',
        details: 'Lui faut une ceinture',
        priority: 'LOW',
      },
      { id: 'user-1', role: 'PLAYER', playerId: 'player-1' },
    );

    expect(prisma.tasks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Test demande',
        description: expect.stringContaining('"kind":"AGENT_REQUEST"'),
        status: 'TODO',
        priority: 'LOW',
        users_tasks_creatorIdTousers: { connect: { id: 'user-1' } },
      }),
      include: expect.any(Object),
    });
    expect(result.title).toBe('Test demande');
    expect(result.category).toBe('EQUIPMENT');
    expect(result.status).toBe('CREATED');
  });

  it('refuse creating request with empty title', async () => {
    await expect(
      service.createRequest({ title: ' ', category: 'OTHER' }, { id: 'user-1', role: 'PLAYER' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows agent to create request with scout assignee', async () => {
    prisma.users.findUnique.mockResolvedValue({
      id: 'scout-1',
      role: 'SCOUT',
    } as any);

    prisma.tasks.create.mockResolvedValue({
      id: 'task-2',
      title: 'Mission agent',
      description: JSON.stringify({
        kind: 'AGENT_REQUEST',
        category: 'OTHER',
        assigneeId: 'scout-1',
      }),
      status: 'TODO',
      priority: 'MEDIUM',
      creatorId: 'agent-1',
      assigneeId: 'scout-1',
      dueDate: null,
      createdAt: new Date('2026-02-20T10:00:00.000Z'),
      updatedAt: new Date('2026-02-20T10:00:00.000Z'),
      users_tasks_creatorIdTousers: { id: 'agent-1', firstName: 'Ada', lastName: 'Agent' },
      users_tasks_assigneeIdTousers: { id: 'scout-1', firstName: 'Sam', lastName: 'Scout' },
    } as any);

    const result = await service.createRequest(
      {
        title: 'Mission agent',
        category: 'OTHER',
        assigneeId: 'scout-1',
      },
      { id: 'agent-1', role: 'AGENT' },
    );

    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { id: 'scout-1' },
      select: {
        id: true,
        role: true,
      },
    });
    expect(prisma.tasks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        users_tasks_assigneeIdTousers: {
          connect: { id: 'scout-1' },
        },
      }),
      include: expect.any(Object),
    });
    expect(result.assignee?.id).toBe('scout-1');
  });

  it('rejects assignee target for non agent/admin roles', async () => {
    await expect(
      service.createRequest(
        {
          title: 'Demande invalide',
          category: 'OTHER',
          assigneeId: 'scout-1',
        },
        { id: 'player-1', role: 'PLAYER' },
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.tasks.create).not.toHaveBeenCalled();
  });

  it('lists agent requests with category filter and pagination', async () => {
    prisma.tasks.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Req 1',
        description: JSON.stringify({ kind: 'AGENT_REQUEST', category: 'INJURY' }),
        status: 'TODO',
        priority: 'MEDIUM',
        creatorId: 'user-1',
        assigneeId: null,
        dueDate: null,
        createdAt: new Date('2026-02-20T10:00:00.000Z'),
        updatedAt: new Date('2026-02-20T10:00:00.000Z'),
        users_tasks_creatorIdTousers: { id: 'user-1', firstName: 'Ana', lastName: 'Test' },
        users_tasks_assigneeIdTousers: null,
      } as any,
    ]);

    const result = await service.listRequests({
      category: 'INJURY',
      page: 1,
      limit: 20,
      includeMineOnly: false,
      actorId: 'user-2',
    });

    expect(prisma.tasks.findMany).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.data[0].category).toBe('INJURY');
  });

  it('updates request status', async () => {
    prisma.tasks.findUnique.mockResolvedValue({
      description: JSON.stringify({
        kind: 'AGENT_REQUEST',
        category: 'OTHER',
      }),
    } as any);

    prisma.tasks.update.mockResolvedValue({
      id: 'task-1',
      title: 'Req 1',
      description: JSON.stringify({ kind: 'AGENT_REQUEST', category: 'OTHER' }),
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      creatorId: 'user-1',
      assigneeId: null,
      dueDate: null,
      createdAt: new Date('2026-02-20T10:00:00.000Z'),
      updatedAt: new Date('2026-02-20T10:10:00.000Z'),
      users_tasks_creatorIdTousers: { id: 'user-1', firstName: 'Ana', lastName: 'Test' },
      users_tasks_assigneeIdTousers: null,
    } as any);

    const result = await service.updateStatus('task-1', 'IN_PROGRESS', 'user-1');

    expect(prisma.tasks.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { status: 'IN_PROGRESS' },
      include: expect.any(Object),
    });
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('returns default market rules', async () => {
    const result = await service.getMarketRules();
    expect(result.rules).toHaveLength(2);
    expect(result.rules[0].id).toBe('italy-forward');
    const franceRule = result.rules.find((rule) => rule.id === 'france-attaquant');
    expect(franceRule?.preferredFoot).toBe('LEFT');
    expect(franceRule?.minEndurance).toBe(80);
  });
});
