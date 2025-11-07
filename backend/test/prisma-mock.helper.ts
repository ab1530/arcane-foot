import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const createPrismaMock = (): MockPrismaClient => {
  return mockDeep<PrismaClient>();
};

export const resetPrismaMock = (prismaMock: MockPrismaClient): void => {
  mockReset(prismaMock);
};
