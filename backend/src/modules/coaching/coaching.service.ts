import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RateBookingDto } from './dto/rate-booking.dto';
import { CoachingType, CoachingBookingStatus } from '@prisma/client';

@Injectable()
export class CoachingService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Créer un nouveau coach (admins only)
   */
  async createCoach(dto: CreateCoachDto) {
    const coach = await this.prisma.coaches.create({
      data: {
        id: randomUUID(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        avatar: dto.avatar,
        bio: dto.bio,
        coachingType: dto.coachingType,
        specialties: dto.specialties || [],
        hourlyRate: dto.hourlyRate,
        currency: dto.currency || 'EUR',
        isActive: dto.isActive ?? true,
        city: dto.city,
        country: dto.country,
        canWorkRemote: dto.canWorkRemote ?? false,
        languages: dto.languages || [],
        certifications: dto.certifications || [],
        yearsExperience: dto.yearsExperience,
        minTierRequired: dto.minTierRequired || 'BASIC',
        updatedAt: new Date(),
      },
    });

    return coach;
  }

  /**
   * Récupérer tous les coaches (avec filtres)
   */
  async getAllCoaches(filters?: {
    coachingType?: CoachingType;
    city?: string;
    isActive?: boolean;
    canWorkRemote?: boolean;
  }) {
    const where: any = {};

    if (filters?.coachingType) {
      where.coachingType = filters.coachingType;
    }

    if (filters?.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.canWorkRemote !== undefined) {
      where.canWorkRemote = filters.canWorkRemote;
    }

    const coaches = await this.prisma.coaches.findMany({
      where,
      include: {
        coaching_bookings: {
          select: {
            id: true,
            sessionDate: true,
            status: true,
            userRating: true,
          },
        },
        _count: {
          select: {
            coaching_bookings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculer la note moyenne pour chaque coach
    return coaches.map((coach) => {
      const ratings = coach.coaching_bookings
        .filter((b) => b.userRating !== null)
        .map((b) => b.userRating!);

      const averageRating =
        ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

      return {
        ...coach,
        averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
        totalBookings: coach._count.coaching_bookings,
      };
    });
  }

  /**
   * Récupérer un coach par ID
   */
  async getCoachById(id: string) {
    const coach = await this.prisma.coaches.findUnique({
      where: { id },
      include: {
        coaching_bookings: {
          where: {
            userRating: {
              not: null,
            },
          },
          select: {
            id: true,
            userRating: true,
            userFeedback: true,
            sessionDate: true,
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            sessionDate: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            coaching_bookings: true,
          },
        },
      },
    });

    if (!coach) {
      throw new NotFoundException('Coach non trouvé');
    }

    // Calculer la note moyenne
    const ratings = coach.coaching_bookings
      .filter((b) => b.userRating !== null)
      .map((b) => b.userRating!);

    const averageRating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

    return {
      ...coach,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      totalBookings: coach._count.coaching_bookings,
    };
  }

  /**
   * Mettre à jour un coach
   */
  async updateCoach(id: string, dto: UpdateCoachDto) {
    const coach = await this.prisma.coaches.findUnique({ where: { id } });

    if (!coach) {
      throw new NotFoundException('Coach non trouvé');
    }

    const updated = await this.prisma.coaches.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.email && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.coachingType && { coachingType: dto.coachingType }),
        ...(dto.specialties && { specialties: dto.specialties }),
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.canWorkRemote !== undefined && { canWorkRemote: dto.canWorkRemote }),
        ...(dto.languages && { languages: dto.languages }),
        ...(dto.certifications && { certifications: dto.certifications }),
        ...(dto.yearsExperience !== undefined && { yearsExperience: dto.yearsExperience }),
        ...(dto.minTierRequired !== undefined && { minTierRequired: dto.minTierRequired }),
      },
    });

    return updated;
  }

  /**
   * Supprimer un coach
   */
  async deleteCoach(id: string) {
    const coach = await this.prisma.coaches.findUnique({ where: { id } });

    if (!coach) {
      throw new NotFoundException('Coach non trouvé');
    }

    await this.prisma.coaches.delete({ where: { id } });

    return { message: 'Coach supprimé avec succès' };
  }

  /**
   * Créer une réservation
   */
  async createBooking(userId: string, dto: CreateBookingDto) {
    // Vérifier que le coach existe
    const coach = await this.prisma.coaches.findUnique({
      where: { id: dto.coachId },
    });

    if (!coach) {
      throw new NotFoundException('Coach non trouvé');
    }

    if (!coach.isActive) {
      throw new BadRequestException("Ce coach n'est pas disponible actuellement");
    }

    // Vérifier le tier minimum requis
    if (coach.minTierRequired) {
      const hasAccess = await this.subscriptionsService.hasMinimumTier(
        userId,
        coach.minTierRequired,
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          `Ce coach nécessite un abonnement ${coach.minTierRequired} ou supérieur`,
        );
      }
    }

    // Calculer le prix
    const duration = dto.duration || 60;
    const price = (coach.hourlyRate / 60) * duration;

    // Créer le Payment Intent Stripe
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const paymentIntent = await this.stripeService.createPaymentIntent(
      Math.round(price * 100), // Convert to cents
      coach.currency.toLowerCase(),
      undefined,
      {
        coachId: coach.id,
        userId: user.id,
        sessionDate: dto.sessionDate,
      },
    );

    // Créer la réservation
    const booking = await this.prisma.coaching_bookings.create({
      data: {
        id: randomUUID(),
        userId,
        coachId: dto.coachId,
        sessionDate: new Date(dto.sessionDate),
        duration,
        location: dto.location,
        isRemote: dto.isRemote ?? false,
        meetingLink: dto.meetingLink,
        status: CoachingBookingStatus.PENDING,
        price,
        currency: coach.currency,
        paymentIntentId: paymentIntent.id,
        userNotes: dto.userNotes,
        updatedAt: new Date(),
      },
      include: {
        coaches: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return booking;
  }

  /**
   * Récupérer mes réservations
   */
  async getMyBookings(userId: string) {
    const bookings = await this.prisma.coaching_bookings.findMany({
      where: { userId },
      include: {
        coaches: true,
      },
      orderBy: {
        sessionDate: 'desc',
      },
    });

    return bookings;
  }

  /**
   * Récupérer une réservation par ID
   */
  async getBookingById(userId: string, bookingId: string) {
    const booking = await this.prisma.coaching_bookings.findUnique({
      where: { id: bookingId },
      include: {
        coaches: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à voir cette réservation");
    }

    return booking;
  }

  /**
   * Annuler une réservation
   */
  async cancelBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.coaching_bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à annuler cette réservation");
    }

    if (booking.status === CoachingBookingStatus.COMPLETED) {
      throw new BadRequestException("Impossible d'annuler une séance terminée");
    }

    if (booking.status === CoachingBookingStatus.CANCELLED) {
      throw new BadRequestException('Cette réservation est déjà annulée');
    }

    await this.prisma.coaching_bookings.update({
      where: { id: bookingId },
      data: {
        status: CoachingBookingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    return { message: 'Réservation annulée avec succès' };
  }

  /**
   * Noter une réservation
   */
  async rateBooking(userId: string, bookingId: string, dto: RateBookingDto) {
    const booking = await this.prisma.coaching_bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à noter cette réservation");
    }

    if (booking.status !== CoachingBookingStatus.COMPLETED) {
      throw new BadRequestException("Vous ne pouvez noter qu'une séance terminée");
    }

    const updated = await this.prisma.coaching_bookings.update({
      where: { id: bookingId },
      data: {
        userRating: dto.userRating,
        userFeedback: dto.userFeedback,
      },
      include: {
        coaches: true,
      },
    });

    return updated;
  }

  /**
   * Confirmer le paiement d'une réservation (appelé par webhook Stripe)
   */
  async confirmPayment(paymentIntentId: string) {
    const booking = await this.prisma.coaching_bookings.findFirst({
      where: { paymentIntentId },
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    await this.prisma.coaching_bookings.update({
      where: { id: booking.id },
      data: {
        hasPaid: true,
        paidAt: new Date(),
        status: CoachingBookingStatus.CONFIRMED,
      },
    });

    return { message: 'Paiement confirmé' };
  }

  /**
   * Marquer une séance comme complétée (coaches/admins only)
   */
  async completeBooking(bookingId: string, coachFeedback?: string) {
    const booking = await this.prisma.coaching_bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    await this.prisma.coaching_bookings.update({
      where: { id: bookingId },
      data: {
        status: CoachingBookingStatus.COMPLETED,
        completedAt: new Date(),
        coachFeedback,
      },
    });

    return { message: 'Séance marquée comme terminée' };
  }

  /**
   * Récupérer les réservations d'un coach
   */
  async getCoachBookings(coachId: string) {
    const coach = await this.prisma.coaches.findUnique({ where: { id: coachId } });

    if (!coach) {
      throw new NotFoundException('Coach non trouvé');
    }

    const bookings = await this.prisma.coaching_bookings.findMany({
      where: { coachId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        sessionDate: 'desc',
      },
    });

    return bookings;
  }
}
