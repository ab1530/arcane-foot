import { Injectable } from '@nestjs/common';
import { NormalizerUtil } from './normalizer.util';

@Injectable()
export class CompetitionMapper {
  constructor(private normalizer: NormalizerUtil) {}

  fromExternal(external: any, source: string): any {
    return {
      name: this.normalizer.normalizeName(external.name),
      shortName: external.shortName || external.name.substring(0, 10),
      country: external.country,
      level: 'professional',
      type: external.type || 'league',
      season: external.season || '2024-2025',
      logo: external.logo || null,
      externalId: external.id.toString(),
      externalSource: source,
      startDate: external.startDate ? new Date(external.startDate) : null,
      endDate: external.endDate ? new Date(external.endDate) : null,
      currentMatchday: external.currentMatchday || null,
      lastSyncAt: new Date(),
    };
  }
}
