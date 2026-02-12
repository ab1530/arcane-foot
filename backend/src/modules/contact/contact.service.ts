import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

interface ContactMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactMessageDto, meta: ContactMeta) {
    if (dto.company?.trim()) {
      this.logger.warn('Contact spam trap triggered', {
        ipAddress: meta.ipAddress,
      });
      return;
    }

    await this.prisma.contact_messages.create({
      data: {
        id: randomUUID(),
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        type: dto.type.trim(),
        message: dto.message.trim(),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  }
}
