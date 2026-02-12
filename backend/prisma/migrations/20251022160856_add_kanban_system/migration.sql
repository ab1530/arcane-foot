-- CreateEnum
CREATE TYPE "KanbanColumnType" AS ENUM ('PROSPECT', 'CONTACTED', 'INTERESTED', 'NEGOTIATING', 'OFFER_MADE', 'SIGNED', 'ARCHIVED', 'CUSTOM');

-- CreateTable
CREATE TABLE "kanban_boards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_columns" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "KanbanColumnType" NOT NULL DEFAULT 'CUSTOM',
    "color" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "cardLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_cards" (
    "id" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT[],
    "dueDate" TIMESTAMP(3),
    "reminderDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_card_activities" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromColumnId" TEXT,
    "toColumnId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_card_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kanban_boards_ownerId_idx" ON "kanban_boards"("ownerId");

-- CreateIndex
CREATE INDEX "kanban_columns_boardId_idx" ON "kanban_columns"("boardId");

-- CreateIndex
CREATE INDEX "kanban_columns_position_idx" ON "kanban_columns"("position");

-- CreateIndex
CREATE INDEX "kanban_cards_columnId_idx" ON "kanban_cards"("columnId");

-- CreateIndex
CREATE INDEX "kanban_cards_playerId_idx" ON "kanban_cards"("playerId");

-- CreateIndex
CREATE INDEX "kanban_cards_position_idx" ON "kanban_cards"("position");

-- CreateIndex
CREATE INDEX "kanban_cards_priority_idx" ON "kanban_cards"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "kanban_cards_columnId_playerId_key" ON "kanban_cards"("columnId", "playerId");

-- CreateIndex
CREATE INDEX "kanban_card_activities_cardId_idx" ON "kanban_card_activities"("cardId");

-- CreateIndex
CREATE INDEX "kanban_card_activities_createdAt_idx" ON "kanban_card_activities"("createdAt");

-- AddForeignKey
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "kanban_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "kanban_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_card_activities" ADD CONSTRAINT "kanban_card_activities_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "kanban_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
