import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlayerType, VerificationStatus, UserRole } from '@prisma/client';
import { BulkImportDto, BulkPlayerDto } from './dto/bulk-import.dto';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ValidationError[];
  players: any[];
}

@Injectable()
export class BulkImportService {
  private readonly logger = new Logger(BulkImportService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Parse CSV file content and convert to BulkPlayerDto array
   */
  parseCsvFile(csvContent: string): BulkPlayerDto[] {
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
      throw new BadRequestException('CSV file must contain at least a header and one data row');
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Validate required columns
    const requiredColumns = ['firstname', 'lastname', 'email', 'position', 'dateofbirth', 'nationality'];
    const missingColumns = requiredColumns.filter(col => !header.includes(col));

    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `CSV file is missing required columns: ${missingColumns.join(', ')}`
      );
    }

    // Parse data rows
    const players: BulkPlayerDto[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = this.parseCSVLine(line);

      if (values.length !== header.length) {
        this.logger.warn(`Row ${i + 1} has incorrect number of columns, skipping`);
        continue;
      }

      const playerData: any = {};

      header.forEach((col, index) => {
        const value = values[index].trim();
        if (value) {
          playerData[col] = value;
        }
      });

      // Map CSV columns to DTO properties
      const player: BulkPlayerDto = {
        firstName: playerData['firstname'] || '',
        lastName: playerData['lastname'] || '',
        email: playerData['email'] || '',
        phone: playerData['phone'],
        position: playerData['position'] || '',
        dateOfBirth: playerData['dateofbirth'] || '',
        nationality: playerData['nationality'] || '',
        height: playerData['height'] ? parseFloat(playerData['height']) : undefined,
        weight: playerData['weight'] ? parseFloat(playerData['weight']) : undefined,
        preferredFoot: playerData['preferredfoot'],
        clubName: playerData['clubname'],
      };

      players.push(player);
    }

    return players;
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Validate bulk data before import
   */
  async validateBulkData(players: BulkPlayerDto[]): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const emails = new Set<string>();

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const row = i + 1;

      // Check for required fields
      if (!player.firstName) {
        errors.push({ row, field: 'firstName', message: 'First name is required' });
      }

      if (!player.lastName) {
        errors.push({ row, field: 'lastName', message: 'Last name is required' });
      }

      if (!player.email) {
        errors.push({ row, field: 'email', message: 'Email is required' });
      } else {
        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(player.email)) {
          errors.push({ row, field: 'email', message: 'Invalid email format' });
        }

        // Check for duplicate emails in the batch
        if (emails.has(player.email.toLowerCase())) {
          errors.push({ row, field: 'email', message: 'Duplicate email in CSV' });
        } else {
          emails.add(player.email.toLowerCase());
        }

        // Check if email already exists in database
        const existingUser = await this.prisma.users.findUnique({
          where: { email: player.email.toLowerCase() },
        });

        if (existingUser) {
          errors.push({ row, field: 'email', message: 'Email already exists in database' });
        }
      }

      if (!player.position) {
        errors.push({ row, field: 'position', message: 'Position is required' });
      }

      if (!player.dateOfBirth) {
        errors.push({ row, field: 'dateOfBirth', message: 'Date of birth is required' });
      } else {
        // Validate date format
        const date = new Date(player.dateOfBirth);
        if (isNaN(date.getTime())) {
          errors.push({ row, field: 'dateOfBirth', message: 'Invalid date format' });
        }
      }

      if (!player.nationality) {
        errors.push({ row, field: 'nationality', message: 'Nationality is required' });
      }

      // Validate optional numeric fields
      if (player.height !== undefined && (player.height < 150 || player.height > 220)) {
        errors.push({ row, field: 'height', message: 'Height must be between 150 and 220 cm' });
      }

      if (player.weight !== undefined && (player.weight < 50 || player.weight > 120)) {
        errors.push({ row, field: 'weight', message: 'Weight must be between 50 and 120 kg' });
      }
    }

    return errors;
  }

  /**
   * Import players in bulk
   */
  async importPlayers(
    dto: BulkImportDto,
    importedById: string,
  ): Promise<ImportResult> {
    // Validate all players first
    const validationErrors = await this.validateBulkData(dto.players);

    if (validationErrors.length > 0) {
      return {
        success: false,
        imported: 0,
        failed: dto.players.length,
        errors: validationErrors,
        players: [],
      };
    }

    const importedPlayers: any[] = [];
    const errors: ValidationError[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Import each player
    for (let i = 0; i < dto.players.length; i++) {
      const playerDto = dto.players[i];
      const row = i + 1;

      try {
        // Create player using transaction
        const player = await this.prisma.$transaction(async (tx) => {
          // Generate a random password for the user
          const randomPassword = Math.random().toString(36).slice(-8);
          const passwordHash = await bcrypt.hash(randomPassword, 10);

          // Create user account
          const user = await tx.users.create({
            data: {
              id: randomUUID(),
              email: playerDto.email.toLowerCase(),
              firstName: playerDto.firstName,
              lastName: playerDto.lastName,
              phone: playerDto.phone,
              passwordHash,
              role: UserRole.PUBLIC,
              emailVerified: false,
              isActive: true,
              updatedAt: new Date(),
            },
          });

          // Find or create club if clubName is provided
          let clubId: string | undefined;
          if (playerDto.clubName) {
            const club = await tx.clubs.findFirst({
              where: {
                OR: [
                  { name: { equals: playerDto.clubName, mode: 'insensitive' } },
                  { shortName: { equals: playerDto.clubName, mode: 'insensitive' } },
                ],
              },
            });

            if (club) {
              clubId = club.id;
            }
          }

          // Create player profile
          const newPlayer = await tx.players.create({
            data: {
              id: randomUUID(),
              users: { connect: { id: user.id } },
              playerType: PlayerType.PUBLIC,
              verificationStatus: dto.autoVerify
                ? VerificationStatus.VERIFIED
                : VerificationStatus.PENDING,
              verifiedAt: dto.autoVerify ? new Date() : null,
              verifiedById: dto.autoVerify ? importedById : null,
              position: playerDto.position,
              dateOfBirth: new Date(playerDto.dateOfBirth),
              nationality: playerDto.nationality,
              height: playerDto.height,
              weight: playerDto.weight,
              preferredFoot: playerDto.preferredFoot,
              ...(clubId && { clubs: { connect: { id: clubId } } }),
              isPublic: true,
              updatedAt: new Date(),
            },
            include: {
              users: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
              clubs: true,
            },
          });

          // Create audit log
          await tx.audit_logs.create({
            data: {
              id: randomUUID(),
              userId: importedById,
              action: 'PLAYER_BULK_IMPORTED',
              entityType: 'Player',
              entityId: newPlayer.id,
              changes: {
                source: 'bulk_import',
                autoVerified: dto.autoVerify || false,
                email: playerDto.email,
                firstName: playerDto.firstName,
                lastName: playerDto.lastName,
              },
            },
          });

          return newPlayer;
        });

        importedPlayers.push(player);
        successCount++;

        this.logger.log(
          `Successfully imported player ${playerDto.email} (row ${row})`,
        );
      } catch (error) {
        failureCount++;
        errors.push({
          row,
          field: 'general',
          message: error.message || 'Failed to import player',
        });

        this.logger.error(
          `Failed to import player at row ${row}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Bulk import completed: ${successCount} success, ${failureCount} failed`,
    );

    return {
      success: successCount > 0,
      imported: successCount,
      failed: failureCount,
      errors,
      players: importedPlayers,
    };
  }

  /**
   * Export players to CSV format
   */
  async exportPlayersToCSV(verificationStatus?: VerificationStatus): Promise<string> {
    const where: any = {
      playerType: PlayerType.PUBLIC,
    };

    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    const players = await this.prisma.players.findMany({
      where,
      include: {
        users: true,
        clubs: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // CSV header
    const header = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'position',
      'dateOfBirth',
      'nationality',
      'height',
      'weight',
      'preferredFoot',
      'clubName',
      'verificationStatus',
      'createdAt',
    ].join(',');

    // CSV rows
    const rows = players.map(player => {
      return [
        player.users.firstName,
        player.users.lastName,
        player.users.email,
        player.users.phone || '',
        player.position,
        player.dateOfBirth.toISOString().split('T')[0],
        player.nationality,
        player.height || '',
        player.weight || '',
        player.preferredFoot || '',
        player.clubs?.name || '',
        player.verificationStatus,
        player.createdAt.toISOString(),
      ].map(value => `"${value}"`).join(',');
    });

    return [header, ...rows].join('\n');
  }
}
