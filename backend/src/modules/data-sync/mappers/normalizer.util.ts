import { Injectable } from '@nestjs/common';

@Injectable()
export class NormalizerUtil {
  /**
   * Normalise les noms (accents, majuscules, espaces)
   */
  normalizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // Multiples espaces -> 1 espace
      .replace(/['']/g, "'"); // Apostrophes uniformes
  }

  /**
   * Matching fuzzy pour deduplication
   */
  fuzzyMatch(str1: string, str2: string): boolean {
    const s1 = this.normalizeName(str1.toLowerCase());
    const s2 = this.normalizeName(str2.toLowerCase());

    // Levenshtein distance simplifiée
    const threshold = 0.85;
    const similarity = this.similarity(s1, s2);

    return similarity >= threshold;
  }

  private similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshtein(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshtein(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue;
      }
    }
    return costs[s2.length];
  }
}
