import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchEntity } from './dto/search-query.dto';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: SearchService;

  const mockSearchService = {
    globalSearch: jest.fn(),
    quickSearch: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    searchService = module.get<SearchService>(SearchService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('globalSearch', () => {
    it('should return global search results for all entities', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Messi',
        entities: [SearchEntity.ALL],
        limit: 10,
      };

      const mockResult = {
        query: 'Messi',
        results: {
          players: [
            {
              id: '1',
              users: {
                id: '1',
                firstName: 'Lionel',
                lastName: 'Messi',
                email: 'messi@example.com',
                avatar: null,
              },
              clubs: {
                id: 'club1',
                name: 'PSG',
                logo: null,
              },
            },
          ],
          clubs: [],
          matches: [],
          events: [],
          scouting_reports: [],
        },
        totalResults: 1,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledTimes(1);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should return search results for specific entities (players only)', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Ronaldo',
        entities: [SearchEntity.PLAYERS],
        limit: 5,
      };

      const mockResult = {
        query: 'Ronaldo',
        results: {
          players: [
            {
              id: '2',
              users: {
                id: '2',
                firstName: 'Cristiano',
                lastName: 'Ronaldo',
                email: 'ronaldo@example.com',
                avatar: null,
              },
              clubs: null,
            },
          ],
        },
        totalResults: 1,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledTimes(1);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should return search results for multiple specific entities', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Barcelona',
        entities: [SearchEntity.CLUBS, SearchEntity.MATCHES],
        limit: 10,
      };

      const mockResult = {
        query: 'Barcelona',
        results: {
          clubs: [
            {
              id: 'club1',
              name: 'FC Barcelona',
              shortName: 'Barça',
              logo: null,
              city: 'Barcelona',
              country: 'Spain',
            },
          ],
          matches: [
            {
              id: 'match1',
              clubs_matches_homeClubIdToclubs: {
                id: 'club1',
                name: 'FC Barcelona',
                shortName: 'Barça',
                logo: null,
              },
              clubs_matches_awayClubIdToclubs: {
                id: 'club2',
                name: 'Real Madrid',
                shortName: 'Madrid',
                logo: null,
              },
            },
          ],
        },
        totalResults: 2,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledTimes(1);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should return empty results when no matches found', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'NonexistentPlayer',
        entities: [SearchEntity.ALL],
        limit: 10,
      };

      const mockResult = {
        query: 'NonexistentPlayer',
        results: {
          players: [],
          clubs: [],
          matches: [],
          events: [],
          scouting_reports: [],
        },
        totalResults: 0,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledTimes(1);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should handle search query with custom limit', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Test',
        entities: [SearchEntity.PLAYERS],
        limit: 25,
      };

      const mockResult = {
        query: 'Test',
        results: {
          players: Array(25).fill({
            id: '1',
            users: { firstName: 'Test', lastName: 'Player' },
          }),
        },
        totalResults: 25,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should handle search query with minimum limit (1)', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Test',
        entities: [SearchEntity.PLAYERS],
        limit: 1,
      };

      const mockResult = {
        query: 'Test',
        results: {
          players: [{ id: '1', users: { firstName: 'Test', lastName: 'Player' } }],
        },
        totalResults: 1,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should handle search query with maximum limit (50)', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Test',
        entities: [SearchEntity.ALL],
        limit: 50,
      };

      const mockResult = {
        query: 'Test',
        results: {
          players: Array(50).fill({ id: '1' }),
          clubs: [],
          matches: [],
          events: [],
          scouting_reports: [],
        },
        totalResults: 50,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should search in events entity', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Training',
        entities: [SearchEntity.EVENTS],
        limit: 10,
      };

      const mockResult = {
        query: 'Training',
        results: {
          events: [
            {
              id: 'event1',
              title: 'Training Session',
              description: 'Team training',
              location: 'Stadium',
              startDate: new Date(),
            },
          ],
        },
        totalResults: 1,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should search in scouting reports entity', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Scout',
        entities: [SearchEntity.SCOUTING_REPORTS],
        limit: 10,
      };

      const mockResult = {
        query: 'Scout',
        results: {
          scouting_reports: [
            {
              id: 'report1',
              players: {
                users: {
                  id: '1',
                  firstName: 'Test',
                  lastName: 'Player',
                  avatar: null,
                },
              },
              users: {
                id: 'scout1',
                firstName: 'Scout',
                lastName: 'Name',
              },
            },
          ],
        },
        totalResults: 1,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should handle short query strings', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'M',
        entities: [SearchEntity.ALL],
        limit: 10,
      };

      const mockResult = {
        query: 'M',
        results: {
          players: [],
          clubs: [],
          matches: [],
          events: [],
          scouting_reports: [],
        },
        totalResults: 0,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should handle long query strings', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'This is a very long search query with multiple words',
        entities: [SearchEntity.ALL],
        limit: 10,
      };

      const mockResult = {
        query: 'This is a very long search query with multiple words',
        results: {
          players: [],
          clubs: [],
          matches: [],
          events: [],
          scouting_reports: [],
        },
        totalResults: 0,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should handle case-insensitive search queries', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'UPPERCASE',
        entities: [SearchEntity.PLAYERS],
        limit: 10,
      };

      const mockResult = {
        query: 'UPPERCASE',
        results: {
          players: [
            {
              id: '1',
              users: {
                firstName: 'uppercase',
                lastName: 'player',
              },
            },
          ],
        },
        totalResults: 1,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should pass through the exact DTO object to service', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Test Query',
        entities: [SearchEntity.CLUBS, SearchEntity.PLAYERS],
        limit: 15,
      };

      mockSearchService.globalSearch.mockResolvedValue({
        query: 'Test Query',
        results: {},
        totalResults: 0,
      });

      await controller.globalSearch(searchQueryDto);

      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
      const calledWith = mockSearchService.globalSearch.mock.calls[0][0];
      expect(calledWith).toBe(searchQueryDto);
    });
  });

  describe('quickSearch', () => {
    it('should return quick search results with default limit (5)', async () => {
      const query = 'Messi';
      const mockResult = {
        query: 'Messi',
        results: {
          players: [
            {
              id: '1',
              users: {
                id: '1',
                firstName: 'Lionel',
                lastName: 'Messi',
                email: 'messi@example.com',
                avatar: null,
              },
            },
          ],
          clubs: [],
          matches: [],
        },
        totalResults: 1,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      const result = await controller.quickSearch(query);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.quickSearch).toHaveBeenCalledTimes(1);
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 5);
    });

    it('should return quick search results with custom limit', async () => {
      const query = 'Barcelona';
      const limit = '10';
      const mockResult = {
        query: 'Barcelona',
        results: {
          players: [],
          clubs: [
            {
              id: 'club1',
              name: 'FC Barcelona',
              shortName: 'Barça',
              logo: null,
              city: 'Barcelona',
              country: 'Spain',
            },
          ],
          matches: [],
        },
        totalResults: 1,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      const result = await controller.quickSearch(query, limit);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.quickSearch).toHaveBeenCalledTimes(1);
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 10);
    });

    it('should parse limit parameter from string to number', async () => {
      const query = 'Test';
      const limit = '3';
      const mockResult = {
        query: 'Test',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      await controller.quickSearch(query, limit);

      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 3);
    });

    it('should return results for all three entity types (players, clubs, matches)', async () => {
      const query = 'Football';
      const mockResult = {
        query: 'Football',
        results: {
          players: [
            {
              id: '1',
              users: { firstName: 'Football', lastName: 'Player' },
            },
          ],
          clubs: [
            {
              id: 'club1',
              name: 'Football Club',
            },
          ],
          matches: [
            {
              id: 'match1',
              clubs_matches_homeClubIdToclubs: { name: 'Home Club' },
              clubs_matches_awayClubIdToclubs: { name: 'Away Club' },
            },
          ],
        },
        totalResults: 3,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      const result = await controller.quickSearch(query);

      expect(result).toEqual(mockResult);
      expect(result.results.players).toBeDefined();
      expect(result.results.clubs).toBeDefined();
      expect(result.results.matches).toBeDefined();
    });

    it('should return empty results when no matches found', async () => {
      const query = 'NonexistentQuery';
      const mockResult = {
        query: 'NonexistentQuery',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      const result = await controller.quickSearch(query);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 5);
    });

    it('should limit results per entity according to limit parameter', async () => {
      const query = 'Test';
      const limit = '2';
      const mockResult = {
        query: 'Test',
        results: {
          players: [{ id: '1' }, { id: '2' }],
          clubs: [{ id: 'club1' }, { id: 'club2' }],
          matches: [{ id: 'match1' }, { id: 'match2' }],
        },
        totalResults: 6,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      const result = await controller.quickSearch(query, limit);

      expect(result.results.players.length).toBe(2);
      expect(result.results.clubs.length).toBe(2);
      expect(result.results.matches.length).toBe(2);
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 2);
    });

    it('should handle limit as string "0"', async () => {
      const query = 'Test';
      const limit = '0';
      const mockResult = {
        query: 'Test',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      await controller.quickSearch(query, limit);

      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 0);
    });

    it('should handle large limit values', async () => {
      const query = 'Test';
      const limit = '100';
      const mockResult = {
        query: 'Test',
        results: {
          players: Array(100).fill({ id: '1' }),
          clubs: Array(100).fill({ id: 'club1' }),
          matches: Array(100).fill({ id: 'match1' }),
        },
        totalResults: 300,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      await controller.quickSearch(query, limit);

      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 100);
    });

    it('should use default limit when limit is undefined', async () => {
      const query = 'Test';
      const mockResult = {
        query: 'Test',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      await controller.quickSearch(query, undefined);

      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 5);
    });

    it('should handle NaN when parsing invalid limit string', async () => {
      const query = 'Test';
      const limit = 'invalid';
      const mockResult = {
        query: 'Test',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      await controller.quickSearch(query, limit);

      // parseInt('invalid') returns NaN
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, NaN);
    });

    it('should handle empty query string', async () => {
      const query = '';
      const mockResult = {
        query: '',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      const result = await controller.quickSearch(query);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 5);
    });

    it('should handle whitespace query string', async () => {
      const query = '   ';
      const mockResult = {
        query: '   ',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      const result = await controller.quickSearch(query);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 5);
    });

    it('should handle special characters in query string', async () => {
      const query = 'Test@#$%^&*()';
      const mockResult = {
        query: 'Test@#$%^&*()',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      const result = await controller.quickSearch(query);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 5);
    });

    it('should correctly extract query parameter from @Query decorator', async () => {
      const query = 'ExtractedQuery';
      const mockResult = {
        query: 'ExtractedQuery',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      await controller.quickSearch(query);

      const calledQuery = mockSearchService.quickSearch.mock.calls[0][0];
      expect(calledQuery).toBe(query);
    });

    it('should correctly extract limit parameter from @Query decorator', async () => {
      const query = 'Test';
      const limit = '7';
      const mockResult = {
        query: 'Test',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      await controller.quickSearch(query, limit);

      const calledLimit = mockSearchService.quickSearch.mock.calls[0][1];
      expect(calledLimit).toBe(7);
    });

    it('should handle limit parameter with decimal values (parseInt behavior)', async () => {
      const query = 'Test';
      const limit = '3.7';
      const mockResult = {
        query: 'Test',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      await controller.quickSearch(query, limit);

      // parseInt('3.7') returns 3
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 3);
    });

    it('should pass exact query string without modification', async () => {
      const query = 'CamelCaseQuery123';
      mockSearchService.quickSearch.mockResolvedValue({
        query: 'CamelCaseQuery123',
        results: { players: [], clubs: [], matches: [] },
        totalResults: 0,
      });

      await controller.quickSearch(query);

      expect(mockSearchService.quickSearch).toHaveBeenCalledWith('CamelCaseQuery123', 5);
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from globalSearch service method', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Test',
        entities: [SearchEntity.ALL],
        limit: 10,
      };

      const error = new Error('Database connection failed');
      mockSearchService.globalSearch.mockRejectedValue(error);

      await expect(controller.globalSearch(searchQueryDto)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should propagate errors from quickSearch service method', async () => {
      const query = 'Test';
      const error = new Error('Search service unavailable');
      mockSearchService.quickSearch.mockRejectedValue(error);

      await expect(controller.quickSearch(query)).rejects.toThrow('Search service unavailable');
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 5);
    });

    it('should propagate timeout errors from globalSearch', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Test',
        entities: [SearchEntity.ALL],
        limit: 10,
      };

      const error = new Error('Query timeout');
      mockSearchService.globalSearch.mockRejectedValue(error);

      await expect(controller.globalSearch(searchQueryDto)).rejects.toThrow('Query timeout');
    });

    it('should propagate timeout errors from quickSearch', async () => {
      const query = 'Test';
      const error = new Error('Query timeout');
      mockSearchService.quickSearch.mockRejectedValue(error);

      await expect(controller.quickSearch(query, '5')).rejects.toThrow('Query timeout');
    });

    it('should propagate validation errors from globalSearch', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Test',
        entities: [SearchEntity.PLAYERS],
        limit: 10,
      };

      const error = new Error('Validation failed');
      mockSearchService.globalSearch.mockRejectedValue(error);

      await expect(controller.globalSearch(searchQueryDto)).rejects.toThrow('Validation failed');
    });

    it('should propagate network errors', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Test',
        entities: [SearchEntity.ALL],
        limit: 10,
      };

      const error = new Error('Network error');
      mockSearchService.globalSearch.mockRejectedValue(error);

      await expect(controller.globalSearch(searchQueryDto)).rejects.toThrow('Network error');
    });
  });

  describe('Service Integration', () => {
    it('should correctly delegate globalSearch to service', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Integration Test',
        entities: [SearchEntity.ALL],
        limit: 10,
      };

      const mockResult = {
        query: 'Integration Test',
        results: {},
        totalResults: 0,
      };

      mockSearchService.globalSearch.mockResolvedValue(mockResult);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.globalSearch).toHaveBeenCalledTimes(1);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
    });

    it('should correctly delegate quickSearch to service', async () => {
      const query = 'Integration Test';
      const limit = '8';

      const mockResult = {
        query: 'Integration Test',
        results: {
          players: [],
          clubs: [],
          matches: [],
        },
        totalResults: 0,
      };

      mockSearchService.quickSearch.mockResolvedValue(mockResult);

      const result = await controller.quickSearch(query, limit);

      expect(result).toEqual(mockResult);
      expect(mockSearchService.quickSearch).toHaveBeenCalledTimes(1);
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(query, 8);
    });

    it('should call both search methods independently without interference', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Test',
        entities: [SearchEntity.ALL],
        limit: 10,
      };
      const quickQuery = 'QuickTest';

      mockSearchService.globalSearch.mockResolvedValue({
        query: 'Test',
        results: {},
        totalResults: 0,
      });
      mockSearchService.quickSearch.mockResolvedValue({
        query: 'QuickTest',
        results: {},
        totalResults: 0,
      });

      await controller.globalSearch(searchQueryDto);
      await controller.quickSearch(quickQuery);

      expect(mockSearchService.globalSearch).toHaveBeenCalledTimes(1);
      expect(mockSearchService.quickSearch).toHaveBeenCalledTimes(1);
      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(searchQueryDto);
      expect(mockSearchService.quickSearch).toHaveBeenCalledWith(quickQuery, 5);
    });
  });

  describe('Query Parameter Extraction', () => {
    it('should extract SearchQueryDto object via @Query decorator', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'DTO Test',
        entities: [SearchEntity.CLUBS],
        limit: 15,
      };

      mockSearchService.globalSearch.mockResolvedValue({
        query: 'DTO Test',
        results: {},
        totalResults: 0,
      });

      await controller.globalSearch(searchQueryDto);

      const receivedDto = mockSearchService.globalSearch.mock.calls[0][0];
      expect(receivedDto).toEqual(searchQueryDto);
      expect(receivedDto.query).toBe('DTO Test');
      expect(receivedDto.entities).toEqual([SearchEntity.CLUBS]);
      expect(receivedDto.limit).toBe(15);
    });

    it('should extract individual query parameters via @Query decorator', async () => {
      const query = 'Individual Query';
      const limit = '12';

      mockSearchService.quickSearch.mockResolvedValue({
        query: 'Individual Query',
        results: { players: [], clubs: [], matches: [] },
        totalResults: 0,
      });

      await controller.quickSearch(query, limit);

      const receivedQuery = mockSearchService.quickSearch.mock.calls[0][0];
      const receivedLimit = mockSearchService.quickSearch.mock.calls[0][1];
      expect(receivedQuery).toBe('Individual Query');
      expect(receivedLimit).toBe(12);
    });

    it('should handle optional parameters correctly', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Optional Test',
      };

      mockSearchService.globalSearch.mockResolvedValue({
        query: 'Optional Test',
        results: {},
        totalResults: 0,
      });

      await controller.globalSearch(searchQueryDto);

      const receivedDto = mockSearchService.globalSearch.mock.calls[0][0];
      expect(receivedDto.query).toBe('Optional Test');
      expect(receivedDto.entities).toBeUndefined();
      expect(receivedDto.limit).toBeUndefined();
    });

    it('should handle all entity types in SearchEntity enum', async () => {
      const allEntities = [
        SearchEntity.PLAYERS,
        SearchEntity.CLUBS,
        SearchEntity.MATCHES,
        SearchEntity.EVENTS,
        SearchEntity.SCOUTING_REPORTS,
      ];

      const searchQueryDto: SearchQueryDto = {
        query: 'All Entities',
        entities: allEntities,
        limit: 10,
      };

      mockSearchService.globalSearch.mockResolvedValue({
        query: 'All Entities',
        results: {},
        totalResults: 0,
      });

      await controller.globalSearch(searchQueryDto);

      const receivedDto = mockSearchService.globalSearch.mock.calls[0][0];
      expect(receivedDto.entities).toEqual(allEntities);
    });
  });

  describe('Response Handling', () => {
    it('should return the exact response from globalSearch service', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Response Test',
        entities: [SearchEntity.ALL],
        limit: 10,
      };

      const serviceResponse = {
        query: 'Response Test',
        results: {
          players: [{ id: '1' }],
          clubs: [{ id: 'club1' }],
          matches: [{ id: 'match1' }],
          events: [{ id: 'event1' }],
          scouting_reports: [{ id: 'report1' }],
        },
        totalResults: 5,
      };

      mockSearchService.globalSearch.mockResolvedValue(serviceResponse);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toBe(serviceResponse);
      expect(result).toEqual(serviceResponse);
    });

    it('should return the exact response from quickSearch service', async () => {
      const query = 'Response Test';

      const serviceResponse = {
        query: 'Response Test',
        results: {
          players: [{ id: '1' }],
          clubs: [{ id: 'club1' }],
          matches: [{ id: 'match1' }],
        },
        totalResults: 3,
      };

      mockSearchService.quickSearch.mockResolvedValue(serviceResponse);

      const result = await controller.quickSearch(query);

      expect(result).toBe(serviceResponse);
      expect(result).toEqual(serviceResponse);
    });

    it('should not modify service response in globalSearch', async () => {
      const searchQueryDto: SearchQueryDto = {
        query: 'Modification Test',
        entities: [SearchEntity.PLAYERS],
        limit: 5,
      };

      const originalResponse = {
        query: 'Modification Test',
        results: { players: [{ id: '1', name: 'Test' }] },
        totalResults: 1,
      };

      mockSearchService.globalSearch.mockResolvedValue(originalResponse);

      const result = await controller.globalSearch(searchQueryDto);

      expect(result).toStrictEqual(originalResponse);
      expect(result.query).toBe('Modification Test');
      expect(result.results.players[0].name).toBe('Test');
    });

    it('should not modify service response in quickSearch', async () => {
      const query = 'Modification Test';

      const originalResponse = {
        query: 'Modification Test',
        results: {
          players: [{ id: '1' }],
          clubs: [{ id: 'club1' }],
          matches: [{ id: 'match1' }],
        },
        totalResults: 3,
      };

      mockSearchService.quickSearch.mockResolvedValue(originalResponse);

      const result = await controller.quickSearch(query);

      expect(result).toStrictEqual(originalResponse);
      expect(result.totalResults).toBe(3);
    });
  });
});
