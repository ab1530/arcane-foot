import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Recherche globale',
    description:
      'Recherche dans toutes les entités (joueurs, clubs, matchs, événements, rapports de scouting)',
  })
  @ApiResponse({ status: 200, description: 'Résultats de recherche récupérés avec succès' })
  @ApiResponse({ status: 400, description: 'Paramètres de recherche invalides' })
  globalSearch(@Query() searchQueryDto: SearchQueryDto) {
    return this.searchService.globalSearch(searchQueryDto);
  }

  @Get('quick')
  @ApiOperation({
    summary: 'Recherche rapide',
    description:
      'Recherche rapide dans les principales entités (joueurs, clubs, matchs) avec résultats limités',
  })
  @ApiQuery({ name: 'query', required: true, description: 'Terme de recherche', example: 'Messi' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre de résultats par entité',
    example: 5,
    default: 5,
  })
  @ApiResponse({ status: 200, description: 'Résultats de recherche rapide récupérés avec succès' })
  quickSearch(@Query('query') query: string, @Query('limit') limit?: string) {
    return this.searchService.quickSearch(query, limit ? parseInt(limit) : 5);
  }
}
