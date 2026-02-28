import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TaskPriority, TaskStatus, UserRole, type users, type tasks } from '@prisma/client';
import { CreateAgentRequestDto } from './dto/create-agent-request.dto';
import { MarketProfileRuleDto } from './dto/market-profile-rule.dto';

export type AgentRequestCategory = 'INJURY' | 'MEDICAL' | 'EQUIPMENT' | 'OTHER';
export type AgentRequestStatus = 'CREATED' | 'IN_PROGRESS' | 'SATISFIED' | 'CANCELLED';

type AgentRequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type PersistedMetadata = {
  kind: 'AGENT_REQUEST';
  category: AgentRequestCategory;
  createdByRole?: string | null;
  playerId?: string | null;
  assigneeId?: string | null;
  details?: string | null;
  equipment?: string | null;
  medicalDetails?: string | null;
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
  dueAt?: string | null;
  source?: 'mobile' | 'web';
};

type MarketRule = {
  id: string;
  label: string;
  market: string;
  positions?: string[];
  minHeightCm?: number;
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
  minEndurance?: number;
  traits?: string[];
  isActive: boolean;
};

const DEFAULT_MARKET_RULES: MarketRule[] = [
  {
    id: 'italy-forward',
    label: 'Marché italien (attaquant)',
    market: 'Italie',
    positions: ['ATTAQUANT'],
    minHeightCm: 185,
    preferredFoot: 'RIGHT',
    minEndurance: 78,
    traits: ['Rapide'],
    isActive: true,
  },
  {
    id: 'france-attaquant',
    label: 'Marché français (attaquant)',
    market: 'France',
    positions: ['ATTAQUANT'],
    minHeightCm: 175,
    preferredFoot: 'LEFT',
    minEndurance: 80,
    traits: ['Endurant'],
    isActive: true,
  },
];

const TASK_STATUS_TO_AGENT_STATUS: Record<TaskStatus, AgentRequestStatus> = {
  [TaskStatus.TODO]: 'CREATED',
  [TaskStatus.IN_PROGRESS]: 'IN_PROGRESS',
  [TaskStatus.DONE]: 'SATISFIED',
  [TaskStatus.CANCELLED]: 'CANCELLED',
};

const AGENT_STATUS_TO_TASK_STATUS: Record<AgentRequestStatus, TaskStatus> = {
  CREATED: TaskStatus.TODO,
  IN_PROGRESS: TaskStatus.IN_PROGRESS,
  SATISFIED: TaskStatus.DONE,
  CANCELLED: TaskStatus.CANCELLED,
};

const FALLBACK_PRIORITY: AgentRequestPriority = 'MEDIUM';

@Injectable()
export class AgentRequestsService {
  private readonly marketRules: MarketRule[] = [...DEFAULT_MARKET_RULES];

  constructor(private prisma: PrismaService) {}

  async createRequest(
    payload: CreateAgentRequestDto,
    requester: { id: string; role?: string; playerId?: string },
  ) {
    if (!payload.title?.trim()) {
      throw new BadRequestException('Le titre de la demande est requis');
    }

    const category = payload.category || 'OTHER';
    const requesterRole = this.normalizeRole(requester.role);
    const assigneeId = await this.resolveAssigneeId(payload.assigneeId, requesterRole);
    const playerId = payload.playerId || requester.playerId || null;
    const dueAt = payload.dueAt && this.isISODate(payload.dueAt) ? payload.dueAt : null;

    const metadata: PersistedMetadata = {
      kind: 'AGENT_REQUEST',
      category,
      createdByRole: requesterRole,
      playerId,
      assigneeId,
      details: payload.details,
      equipment: payload.equipment,
      medicalDetails: payload.medicalDetails,
      preferredFoot: payload.preferredFoot,
      dueAt,
      source: 'mobile',
    };

    const created = await this.prisma.tasks.create({
      data: {
        id: randomUUID(),
        title: payload.title.trim(),
        description: JSON.stringify(metadata),
        status: TaskStatus.TODO,
        priority: this.toTaskPriority(payload.priority),
        updatedAt: new Date(),
        users_tasks_creatorIdTousers: {
          connect: { id: requester.id },
        },
        users_tasks_assigneeIdTousers: assigneeId
          ? {
              connect: { id: assigneeId },
            }
          : undefined,
        dueDate: dueAt ? new Date(dueAt) : undefined,
      },
      include: {
        users_tasks_creatorIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        users_tasks_assigneeIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return this.normalizeRequest(created);
  }

  async listRequests(filters: {
    status?: AgentRequestStatus | null;
    category?: AgentRequestCategory | null;
    creatorRole?: string | null;
    page?: number;
    limit?: number;
    includeMineOnly?: boolean;
    actorId?: string;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(Number(filters.limit) || 20, 100));
    const where: Prisma.tasksWhereInput = {
      status: filters.status ? AGENT_STATUS_TO_TASK_STATUS[filters.status] : undefined,
      description: {
        startsWith: '{"kind":"AGENT_REQUEST"',
      },
    };

    if (filters.includeMineOnly && filters.actorId) {
      where.creatorId = filters.actorId;
    }

    const items = await this.prisma.tasks.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        users_tasks_creatorIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        users_tasks_assigneeIdTousers: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const filtered = (items ?? []).filter((task) => {
      if (!task.description) return false;
      const parsed = this.safeParseMetadata(task.description);
      if (!parsed || parsed.kind !== 'AGENT_REQUEST') return false;
      if (filters.category && parsed.category !== filters.category) return false;
      if (filters.creatorRole) {
        const creatorRoleFromMetadata = parsed.createdByRole || null;
        const creatorRoleFromUser = task?.users_tasks_creatorIdTousers?.role || null;
        if (
          creatorRoleFromMetadata !== filters.creatorRole &&
          creatorRoleFromUser !== filters.creatorRole
        ) {
          return false;
        }
      }
      return true;
    });
    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      data: paginated.map((task) =>
        this.normalizeRequest(
          task as tasks & {
            users_tasks_creatorIdTousers: any;
            users_tasks_assigneeIdTousers: any;
          },
        ),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getRequest(id: string) {
    const request = await this.prisma.tasks.findUnique({
      where: { id },
      include: {
        users_tasks_creatorIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        users_tasks_assigneeIdTousers: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Demande avec l'ID ${id} introuvable`);
    }

    const parsed = this.safeParseMetadata(request.description);
    if (!parsed || parsed.kind !== 'AGENT_REQUEST') {
      throw new NotFoundException(`Demande avec l'ID ${id} introuvable`);
    }

    return this.normalizeRequest(
      request as tasks & {
        users_tasks_creatorIdTousers: any;
        users_tasks_assigneeIdTousers: any;
      },
    );
  }

  async updateStatus(id: string, status: AgentRequestStatus, _actorId: string) {
    await this.ensureRequestExists(id);

    const updated = await this.prisma.tasks.update({
      where: { id },
      data: {
        status: AGENT_STATUS_TO_TASK_STATUS[status],
      },
      include: {
        users_tasks_creatorIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        users_tasks_assigneeIdTousers: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return this.normalizeRequest(
      updated as tasks & {
        users_tasks_creatorIdTousers: any;
        users_tasks_assigneeIdTousers: any;
      },
    );
  }

  async getMarketRules() {
    return {
      rules: this.marketRules.map((rule) => ({ ...rule })),
    };
  }

  async setMarketRules(payload: MarketProfileRuleDto[]) {
    const parsed = this.normalizeIncomingRules(payload);
    this.marketRules.length = 0;
    this.marketRules.push(...parsed);
    return this.getMarketRules();
  }

  private async ensureRequestExists(id: string) {
    const request = await this.prisma.tasks.findUnique({
      where: { id },
      select: { description: true },
    });
    if (!request) {
      throw new NotFoundException(`Demande avec l'ID ${id} introuvable`);
    }

    const metadata = this.safeParseMetadata(request.description);
    if (!metadata || metadata.kind !== 'AGENT_REQUEST') {
      throw new NotFoundException(`Demande avec l'ID ${id} introuvable`);
    }
  }

  private normalizeIncomingRules(rules: MarketProfileRuleDto[]) {
    return rules
      .filter((rule) => rule?.id && rule?.label && rule?.market)
      .map((rule) => ({
        id: String(rule.id).trim(),
        label: String(rule.label).trim(),
        market: String(rule.market).trim(),
        positions: Array.isArray(rule.positions)
          ? rule.positions.map((position) => String(position).trim()).filter(Boolean)
          : [],
        minHeightCm:
          typeof rule.minHeightCm === 'number' ? Math.max(100, rule.minHeightCm) : undefined,
        preferredFoot: rule.preferredFoot || undefined,
        minEndurance:
          typeof rule.minEndurance === 'number'
            ? Math.max(0, Math.min(100, rule.minEndurance))
            : undefined,
        traits: Array.isArray(rule.traits)
          ? rule.traits.map((trait) => String(trait).trim()).filter(Boolean)
          : [],
        isActive: rule.isActive ?? true,
      }));
  }

  private normalizeRequest(
    task: tasks & { users_tasks_creatorIdTousers?: any; users_tasks_assigneeIdTousers?: any },
  ) {
    const metadata = this.safeParseMetadata(task.description);
    const creator = task.users_tasks_creatorIdTousers as users | null | undefined;
    const assignee = task.users_tasks_assigneeIdTousers as users | null | undefined;
    const creatorRole = metadata?.createdByRole ?? creator?.role ?? null;

    return {
      id: task.id,
      title: task.title,
      category: metadata?.category || 'OTHER',
      status: TASK_STATUS_TO_AGENT_STATUS[task.status],
      priority: this.fromTaskPriority(task.priority),
      creatorRole,
      playerId: (metadata?.playerId as string) ?? null,
      dueAt: metadata?.dueAt ?? (task.dueDate ? task.dueDate.toISOString() : null),
      details: metadata?.details ?? null,
      content: {
        equipment: metadata?.equipment ?? null,
        medicalDetails: metadata?.medicalDetails ?? null,
        preferredFoot: metadata?.preferredFoot ?? null,
      },
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      creator: creator
        ? { id: creator.id, firstName: creator.firstName, lastName: creator.lastName }
        : null,
      assignee: assignee
        ? { id: assignee.id, firstName: assignee.firstName, lastName: assignee.lastName }
        : null,
    };
  }

  private isISODate(value: string) {
    return /^\d{4}-\d{2}-\d{2}/.test(value);
  }

  private safeParseMetadata(payload: string | null) {
    if (!payload) return null;
    try {
      const parsed = JSON.parse(payload) as PersistedMetadata | null;
      if (!parsed || parsed.kind !== 'AGENT_REQUEST') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private toTaskPriority(priority?: AgentRequestPriority) {
    return (priority || FALLBACK_PRIORITY) as TaskPriority;
  }

  private fromTaskPriority(priority: TaskPriority) {
    if (priority === TaskPriority.URGENT) {
      return 'URGENT';
    }

    if (priority === TaskPriority.HIGH) {
      return 'HIGH';
    }

    if (priority === TaskPriority.LOW) {
      return 'LOW';
    }

    return 'MEDIUM';
  }

  private normalizeRole(role?: string | null) {
    return role?.trim().toUpperCase() || null;
  }

  private canAssignToScout(role?: string | null) {
    return role === 'AGENT' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  private async resolveAssigneeId(assigneeId: string | undefined, requesterRole: string | null) {
    const normalizedAssigneeId = assigneeId?.trim();
    if (!normalizedAssigneeId) {
      return null;
    }

    if (!this.canAssignToScout(requesterRole)) {
      throw new ForbiddenException('Only agent/admin can target a scout assignee');
    }

    const assignee = await this.prisma.users.findUnique({
      where: { id: normalizedAssigneeId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!assignee) {
      throw new NotFoundException(`Scout with ID ${normalizedAssigneeId} not found`);
    }

    if (assignee.role !== UserRole.SCOUT) {
      throw new BadRequestException('Target assignee must have SCOUT role');
    }

    return assignee.id;
  }
}
