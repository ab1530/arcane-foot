import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateCampDto } from './dto/create-camp.dto';
import { UpdateCampDto } from './dto/update-camp.dto';
import { RegisterCampDto } from './dto/register-camp.dto';
import { EvaluateParticipantDto } from './dto/evaluate-participant.dto';
import { CampStatus, CampType, ParticipationStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class CampsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Créer un nouveau camp (agents/admins only)
   */
  async createCamp(dto: CreateCampDto) {
    const camp = await this.prisma.camps.create({
      data: {
        id: randomUUID(),
        name: dto.name,
        description: dto.description,
        type: dto.type,
        status: dto.status || CampStatus.DRAFT,
        location: dto.location,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        capacity: dto.capacity,
        availableSpots: dto.capacity, // Initially all spots available
        ageMin: dto.ageMin,
        ageMax: dto.ageMax,
        price: dto.price || 0,
        currency: dto.currency || 'EUR',
        requiresPayment: dto.requiresPayment ?? false,
        requiredTier: dto.requiredTier,
        programDetails: dto.programDetails,
        includedBenefits: dto.includedBenefits || [],
        partnerClubs: dto.partnerClubs || [],
        hasShowcaseGame: dto.hasShowcaseGame ?? false,
        showcaseDate: dto.showcaseDate ? new Date(dto.showcaseDate) : null,
        coverImage: dto.coverImage,
        images: dto.images || [],
        isPublic: dto.isPublic ?? true,
        updatedAt: new Date(),
        clubs: dto.clubId
          ? {
              connect: { id: dto.clubId },
            }
          : undefined,
      },
      include: {
        clubs: true,
      },
    });

    return camp;
  }

  /**
   * Récupérer tous les camps (avec filtres)
   */
  async getAllCamps(filters?: {
    type?: CampType;
    status?: CampStatus;
    upcoming?: boolean;
    isPublic?: boolean;
  }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.upcoming) {
      where.startDate = {
        gte: new Date(),
      };
    }

    const camps = await this.prisma.camps.findMany({
      where,
      include: {
        clubs: {
          select: {
            id: true,
            name: true,
            logo: true,
            city: true,
            country: true,
          },
        },
        camp_participations: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return camps;
  }

  /**
   * Récupérer un camp par ID
   */
  async getCampById(id: string) {
    const camp = await this.prisma.camps.findUnique({
      where: { id },
      include: {
        clubs: true,
        camp_participations: {
          include: {
            players: {
              include: {
                users: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!camp) {
      throw new NotFoundException('Camp non trouvé');
    }

    return camp;
  }

  /**
   * Mettre à jour un camp
   */
  async updateCamp(id: string, dto: UpdateCampDto) {
    const camp = await this.prisma.camps.findUnique({ where: { id } });

    if (!camp) {
      throw new NotFoundException('Camp non trouvé');
    }

    const updated = await this.prisma.camps.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.status && { status: dto.status }),
        ...(dto.clubId !== undefined && { clubId: dto.clubId }),
        ...(dto.location && { location: dto.location }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.ageMin !== undefined && { ageMin: dto.ageMin }),
        ...(dto.ageMax !== undefined && { ageMax: dto.ageMax }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.requiresPayment !== undefined && { requiresPayment: dto.requiresPayment }),
        ...(dto.requiredTier !== undefined && { requiredTier: dto.requiredTier }),
        ...(dto.programDetails !== undefined && { programDetails: dto.programDetails }),
        ...(dto.includedBenefits && { includedBenefits: dto.includedBenefits }),
        ...(dto.partnerClubs && { partnerClubs: dto.partnerClubs }),
        ...(dto.hasShowcaseGame !== undefined && { hasShowcaseGame: dto.hasShowcaseGame }),
        ...(dto.showcaseDate !== undefined && {
          showcaseDate: dto.showcaseDate ? new Date(dto.showcaseDate) : null,
        }),
        ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
        ...(dto.images && { images: dto.images }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
      include: {
        clubs: true,
      },
    });

    return updated;
  }

  /**
   * Supprimer un camp
   */
  async deleteCamp(id: string) {
    const camp = await this.prisma.camps.findUnique({ where: { id } });

    if (!camp) {
      throw new NotFoundException('Camp non trouvé');
    }

    await this.prisma.camps.delete({ where: { id } });

    return { message: 'Camp supprimé avec succès' };
  }

  /**
   * Inscription à un camp (joueurs publics)
   */
  async registerForCamp(userId: string, campId: string, dto: RegisterCampDto) {
    // Vérifier que le camp existe
    const camp = await this.prisma.camps.findUnique({
      where: { id: campId },
      include: {
        camp_participations: true,
      },
    });

    if (!camp) {
      throw new NotFoundException('Camp non trouvé');
    }

    // Vérifier que le camp est ouvert aux inscriptions
    if (camp.status !== CampStatus.PUBLISHED) {
      throw new BadRequestException("Ce camp n'est pas ouvert aux inscriptions");
    }

    // Vérifier les places disponibles
    if (camp.availableSpots <= 0) {
      throw new BadRequestException('Ce camp est complet');
    }

    // Vérifier le tier requis si nécessaire
    if (camp.requiredTier) {
      const hasAccess = await this.subscriptionsService.hasMinimumTier(userId, camp.requiredTier);
      if (!hasAccess) {
        throw new ForbiddenException(
          `Ce camp nécessite un abonnement ${camp.requiredTier} ou supérieur`,
        );
      }
    }

    // Vérifier que le joueur n'est pas déjà inscrit
    const existingParticipation = await this.prisma.camp_participations.findUnique({
      where: {
        campId_playerId: {
          campId,
          playerId: dto.playerId,
        },
      },
    });

    if (existingParticipation) {
      throw new BadRequestException('Vous êtes déjà inscrit à ce camp');
    }

    // Créer la participation
    let participationStatus: ParticipationStatus = ParticipationStatus.PENDING;
    let paymentIntentId: string | undefined;
    let hasPaid = false;
    let paidAmount: number | undefined;

    // Si paiement requis, créer un Payment Intent Stripe
    if (camp.requiresPayment && camp.price > 0) {
      const user = await this.prisma.users.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Créer le Payment Intent
      const paymentIntent = await this.stripeService.createPaymentIntent(
        Math.round(camp.price * 100), // Convert to cents
        camp.currency.toLowerCase(),
        undefined,
        {
          campId: camp.id,
          playerId: dto.playerId,
          userId: user.id,
        },
      );

      paymentIntentId = paymentIntent.id;
      paidAmount = camp.price;
    } else {
      // Pas de paiement requis, inscription directe
      participationStatus = ParticipationStatus.REGISTERED;
      hasPaid = true;
    }

    const participation = await this.prisma.camp_participations.create({
      data: {
        id: randomUUID(),
        camps: {
          connect: { id: campId },
        },
        players: {
          connect: { id: dto.playerId },
        },
        status: participationStatus,
        hasPaid,
        paidAmount,
        paymentIntentId,
        parentalConsentGiven: dto.parentalConsentGiven ?? false,
        parentalConsentUrl: dto.parentalConsentUrl,
        parentName: dto.parentName,
        parentEmail: dto.parentEmail,
        parentPhone: dto.parentPhone,
        medicalWaiverSigned: dto.medicalWaiverSigned ?? false,
        medicalWaiverUrl: dto.medicalWaiverUrl,
        medicalConditions: dto.medicalConditions,
        emergencyContact: dto.emergencyContact,
        emergencyPhone: dto.emergencyPhone,
        notes: dto.notes,
      },
      include: {
        camps: true,
        players: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Décrémenter les places disponibles
    await this.prisma.camps.update({
      where: { id: campId },
      data: {
        availableSpots: {
          decrement: 1,
        },
      },
    });

    return participation;
  }

  /**
   * Récupérer les inscriptions d'un joueur
   */
  async getMyRegistrations(userId: string) {
    // Trouver le joueur associé à cet utilisateur
    const player = await this.prisma.players.findUnique({
      where: { userId },
    });

    if (!player) {
      throw new NotFoundException('Profil joueur non trouvé');
    }

    const registrations = await this.prisma.camp_participations.findMany({
      where: { playerId: player.id },
      include: {
        camps: {
          include: {
            clubs: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });

    return registrations;
  }

  /**
   * Annuler une inscription
   */
  async cancelRegistration(userId: string, participationId: string) {
    const participation = await this.prisma.camp_participations.findUnique({
      where: { id: participationId },
      include: {
        players: true,
        camps: true,
      },
    });

    if (!participation) {
      throw new NotFoundException('Inscription non trouvée');
    }

    // Vérifier que c'est bien le joueur de l'utilisateur
    if (participation.players.userId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à annuler cette inscription");
    }

    // Annuler l'inscription
    await this.prisma.camp_participations.update({
      where: { id: participationId },
      data: {
        status: ParticipationStatus.CANCELLED,
      },
    });

    // Libérer une place
    await this.prisma.camps.update({
      where: { id: participation.campId },
      data: {
        availableSpots: {
          increment: 1,
        },
      },
    });

    return { message: 'Inscription annulée avec succès' };
  }

  /**
   * Évaluer un participant (scouts/agents only)
   */
  async evaluateParticipant(participationId: string, dto: EvaluateParticipantDto) {
    const participation = await this.prisma.camp_participations.findUnique({
      where: { id: participationId },
    });

    if (!participation) {
      throw new NotFoundException('Participation non trouvée');
    }

    const updated = await this.prisma.camp_participations.update({
      where: { id: participationId },
      data: {
        performanceRating: dto.performanceRating,
        technicalRating: dto.technicalRating,
        physicalRating: dto.physicalRating,
        mentalRating: dto.mentalRating,
        scoutNotes: dto.scoutNotes,
        selectedForShowcase: dto.selectedForShowcase ?? false,
        feedbackReport: dto.feedbackReport,
        evaluatedAt: new Date(),
      },
      include: {
        players: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        camps: true,
      },
    });

    return updated;
  }

  /**
   * Récupérer tous les participants d'un camp
   */
  async getCampParticipants(campId: string) {
    const camp = await this.prisma.camps.findUnique({ where: { id: campId } });

    if (!camp) {
      throw new NotFoundException('Camp non trouvé');
    }

    const participants = await this.prisma.camp_participations.findMany({
      where: { campId },
      include: {
        players: {
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
        },
      },
      orderBy: {
        registeredAt: 'asc',
      },
    });

    return participants;
  }

  /**
   * Confirmer le paiement d'une inscription (appelé par webhook Stripe)
   */
  async confirmPayment(paymentIntentId: string) {
    const participation = await this.prisma.camp_participations.findFirst({
      where: { paymentIntentId },
    });

    if (!participation) {
      throw new NotFoundException('Participation non trouvée');
    }

    await this.prisma.camp_participations.update({
      where: { id: participation.id },
      data: {
        hasPaid: true,
        paidAt: new Date(),
        status: ParticipationStatus.CONFIRMED,
      },
    });

    return { message: 'Paiement confirmé' };
  }
}
