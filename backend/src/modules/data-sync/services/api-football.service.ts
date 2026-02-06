import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiFootballService {
  private readonly logger = new Logger(ApiFootballService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://v3.football.api-sports.io';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('API_FOOTBALL_KEY');
  }

  /**
   * Recupere les competitions majeures
   */
  async getCompetitions(): Promise<any[]> {
    const leagues = [
      { id: 61, name: 'Ligue 1', country: 'FR' },
      { id: 39, name: 'Premier League', country: 'GB' },
      { id: 78, name: 'Bundesliga', country: 'DE' },
      { id: 135, name: 'Serie A', country: 'IT' },
      { id: 140, name: 'La Liga', country: 'ES' },
    ];

    const results = [];

    for (const league of leagues) {
      try {
        const data = await this.fetchApi(`/leagues?id=${league.id}&season=2024`);
        if (data.response && data.response.length > 0) {
          const comp = data.response[0];
          results.push({
            id: comp.league.id,
            name: comp.league.name,
            shortName: league.name,
            country: comp.country.code,
            type: comp.league.type,
            season: '2024-2025',
            logo: comp.league.logo,
            startDate: comp.seasons[0]?.start,
            endDate: comp.seasons[0]?.end,
            currentMatchday: comp.seasons[0]?.current ? 12 : null,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to fetch league ${league.id}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Recupere les equipes d'une competition
   */
  async getTeams(leagueId: string): Promise<any[]> {
    const data = await this.fetchApi(`/teams?league=${leagueId}&season=2024`);

    return data.response.map((item: any) => ({
      id: item.team.id,
      name: item.team.name,
      shortName: item.team.code,
      logo: item.team.logo,
      country: item.team.country,
      city: item.venue?.city,
      stadium: item.venue?.name,
      founded: item.team.founded,
    }));
  }

  /**
   * Recupere les joueurs d'une equipe
   */
  async getPlayers(teamId: string): Promise<any[]> {
    const data = await this.fetchApi(`/players/squads?team=${teamId}`);

    if (!data.response || data.response.length === 0) {
      return [];
    }

    return data.response[0].players.map((player: any) => ({
      id: player.id,
      name: player.name,
      firstName: player.name.split(' ')[0],
      lastName: player.name.split(' ').slice(1).join(' '),
      position: player.position,
      age: player.age,
      nationality: player.nationality,
      photoUrl: player.photo,
    }));
  }

  /**
   * Recupere les matchs d'une competition
   */
  async getFixtures(leagueId: string): Promise<any[]> {
    const data = await this.fetchApi(`/fixtures?league=${leagueId}&season=2024`);

    return data.response.map((item: any) => ({
      homeTeamId: item.teams.home.id,
      awayTeamId: item.teams.away.id,
      scheduledAt: new Date(item.fixture.date),
      status: this.mapStatus(item.fixture.status.short),
      homeScore: item.goals.home,
      awayScore: item.goals.away,
      referee: item.fixture.referee,
      venue: item.fixture.venue.name,
      round: item.league.round,
    }));
  }

  /**
   * Fetch API avec retry logic
   */
  private async fetchApi(endpoint: string, retries = 3): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'x-apisports-key': this.apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.errors && Object.keys(data.errors).length > 0) {
          throw new Error(`API Error: ${JSON.stringify(data.errors)}`);
        }

        return data;
      } catch (error) {
        this.logger.warn(`Attempt ${attempt}/${retries} failed: ${error.message}`);

        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        await this.sleep(1000 * Math.pow(2, attempt));
      }
    }
  }

  private mapStatus(apiStatus: string): string {
    const statusMap = {
      TBD: 'SCHEDULED',
      NS: 'SCHEDULED',
      '1H': 'LIVE',
      HT: 'LIVE',
      '2H': 'LIVE',
      ET: 'LIVE',
      P: 'LIVE',
      FT: 'COMPLETED',
      AET: 'COMPLETED',
      PEN: 'COMPLETED',
      PST: 'POSTPONED',
      CANC: 'CANCELLED',
    };

    return statusMap[apiStatus] || 'SCHEDULED';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
