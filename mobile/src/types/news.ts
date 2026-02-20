export type NewsCategory = 'clubs' | 'players' | 'market' | 'notifications';

export interface NewsFeedItem {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string | null;
  source: string;
  details: string | null;
  timestamp: string;
  link: string | null;
}

export interface NewsFeedMeta {
  limit: number;
  total: number;
  categories: NewsCategory[];
  include: {
    players: number;
    clubs: number;
    market: number;
    notifications: number;
  };
}

export interface NewsFeedResponse {
  data: NewsFeedItem[];
  generatedAt: string;
  meta: NewsFeedMeta;
}
