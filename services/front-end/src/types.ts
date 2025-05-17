export interface ArticleMetrics {
  views: number;
  timeSpent: number;
  rating: number;
}

export interface Article {
  articleId: string;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
  metrics?: ArticleMetrics;
  sourceUrl?: string;
  importedAt?: string;
}

export interface CreateArticlePayload {
  title: string;
  content: string;
  author: string;
}

export interface ArticleListResponse {
  articles: Article[];
  nextToken: string | null;
}

export interface EngagementStats {
  totalArticles: number;
  topArticlesByViews: Array<{ articleId: string; title: string; author: string; views: number }>;
  topArticlesByTimeSpent: Array<{ articleId: string; title: string; author: string; timeSpent: number }>;
  topArticlesByRating: Array<{ articleId: string; title: string; author: string; rating: number }>;
  averageMetrics: { views: number; timeSpent: number; rating: number };
  topAuthors: Array<{ author: string; articleCount: number }>;
}