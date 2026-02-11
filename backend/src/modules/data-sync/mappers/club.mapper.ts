import { Injectable } from '@nestjs/common';
import { NormalizerUtil } from './normalizer.util';

@Injectable()
export class ClubMapper {
  constructor(private normalizer: NormalizerUtil) {}

  fromExternal(external: any, source: string): any {
    return {
      name: this.normalizer.normalizeName(external.name),
      shortName: external.shortName || external.name.substring(0, 10),
      logo: external.logo,
      country: external.country,
      city: external.city,
      stadium: external.stadium,
      founded: external.founded,
      website: null, // Non fourni par API-Football
      externalId: external.id.toString(),
      externalSource: source,
      lastSyncAt: new Date(),
    };
  }
}
