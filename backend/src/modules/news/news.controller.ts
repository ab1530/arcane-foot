import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NewsFeedCategory, NewsFeedQueryDto } from './dto/news-feed-query.dto';
import { NewsService } from './news.service';

@ApiTags('News')
@ApiBearerAuth('JWT-auth')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Legacy alias for news feed' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categories', required: false, type: String, description: 'Comma-separated category list (clubs,players,market,notifications)' })
  @ApiResponse({
    status: 200,
    description: 'Combined feed with latest club, player, market and notification items.',
  })
  async getFeedAlias(@Request() req: any, @Query() query: NewsFeedQueryDto) {
    const categories: NewsFeedCategory[] = query.categories?.length
      ? query.categories
      : ['clubs', 'players', 'market', 'notifications'];

    const limit = query.limit;
    return this.newsService.getNewsFeed(req.user.id, limit ?? 20, categories);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get live news feed for the connected user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categories', required: false, type: String, description: 'Comma-separated category list (clubs,players,market,notifications)' })
  @ApiResponse({
    status: 200,
    description: 'Combined feed with latest club, player, market and notification items.',
  })
  async getFeed(@Request() req: any, @Query() query: NewsFeedQueryDto) {
    const categories: NewsFeedCategory[] = query.categories?.length
      ? query.categories
      : ['clubs', 'players', 'market', 'notifications'];

    const limit = query.limit;
    return this.newsService.getNewsFeed(req.user.id, limit ?? 20, categories);
  }
}
