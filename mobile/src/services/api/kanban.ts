import api from '../api';

export type KanbanColumnType = 'PROSPECT' | 'CONTACTED' | 'INTERESTED' | 'NEGOTIATING' | 'OFFER_MADE' | 'SIGNED' | 'ARCHIVED' | 'CUSTOM';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  columns?: KanbanColumn[];
}

export interface KanbanColumn {
  id: string;
  boardId: string;
  name: string;
  type: KanbanColumnType;
  color?: string;
  position: number;
  cardLimit?: number;
  createdAt: string;
  updatedAt: string;
  cards?: KanbanCard[];
}

export interface KanbanCard {
  id: string;
  columnId: string;
  playerId: string;
  position: number;
  notes?: string;
  priority: TaskPriority;
  tags?: string[];
  dueDate?: string;
  reminderDate?: string;
  createdAt: string;
  updatedAt: string;
  movedAt: string;
  player?: any;
  column?: KanbanColumn;
}

export const kanbanApi = {
  // Boards
  createBoard: async (data: { name: string; description?: string; isPublic?: boolean }): Promise<KanbanBoard> => {
    return api.postRaw('/kanban/boards', data);
  },

  getAllBoards: async (): Promise<KanbanBoard[]> => {
    return api.getRaw('/kanban/boards');
  },

  getBoard: async (id: string): Promise<KanbanBoard> => {
    return api.getRaw(`/kanban/boards/${id}`);
  },

  updateBoard: async (id: string, data: Partial<{ name: string; description?: string; isPublic?: boolean }>): Promise<KanbanBoard> => {
    return api.patchRaw(`/kanban/boards/${id}`, data);
  },

  deleteBoard: async (id: string): Promise<void> => {
    await api.deleteRaw(`/kanban/boards/${id}`);
  },

  // Columns
  createColumn: async (boardId: string, data: { name: string; type: KanbanColumnType; color?: string; position?: number }): Promise<KanbanColumn> => {
    return api.postRaw(`/kanban/boards/${boardId}/columns`, data);
  },

  updateColumn: async (id: string, data: Partial<{ name: string; type: KanbanColumnType; color?: string; position?: number }>): Promise<KanbanColumn> => {
    return api.patchRaw(`/kanban/columns/${id}`, data);
  },

  deleteColumn: async (id: string): Promise<void> => {
    await api.deleteRaw(`/kanban/columns/${id}`);
  },

  // Cards
  createCard: async (data: { playerId: string; columnId: string; notes?: string; priority?: TaskPriority; tags?: string[] }): Promise<KanbanCard> => {
    return api.postRaw('/kanban/cards', data);
  },

  getCard: async (id: string): Promise<KanbanCard> => {
    return api.getRaw(`/kanban/cards/${id}`);
  },

  updateCard: async (id: string, data: Partial<{ notes?: string; priority?: TaskPriority; tags?: string[] }>): Promise<KanbanCard> => {
    return api.patchRaw(`/kanban/cards/${id}`, data);
  },

  moveCard: async (id: string, data: { targetColumnId: string; position?: number }): Promise<KanbanCard> => {
    return api.postRaw(`/kanban/cards/${id}/move`, data);
  },

  deleteCard: async (id: string): Promise<void> => {
    await api.deleteRaw(`/kanban/cards/${id}`);
  },

  getCardActivities: async (id: string): Promise<any[]> => {
    return api.getRaw(`/kanban/cards/${id}/activities`);
  },
};
