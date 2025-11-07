import { Injectable } from '@nestjs/common';
import { NormalizerUtil } from './normalizer.util';

@Injectable()
export class PlayerMapper {
  constructor(private normalizer: NormalizerUtil) {}

  fromExternal(external: any, source: string): any {
    // Split full name into firstName and lastName
    const nameParts = this.normalizer.normalizeName(external.firstName || external.name || '').split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Player';

    return {
      position: external.position || 'Unknown',
      height: external.height || null,
      weight: external.weight || null,
      dateOfBirth: external.dateOfBirth ? new Date(external.dateOfBirth) : new Date('2000-01-01'),
      nationality: external.nationality || 'Unknown',
      jerseyNumber: external.jerseyNumber || null,
      status: 'ACTIVE',
      photoUrl: external.photoUrl || null,
      externalId: external.id.toString(),
      externalSource: source,
      lastSyncAt: new Date(),
      // User data (will be merged with User creation)
      _firstName: firstName,
      _lastName: lastName,
    };
  }
}
