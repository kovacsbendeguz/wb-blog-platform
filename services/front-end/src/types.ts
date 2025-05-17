export interface Article {
  articleId: string;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
  metrics?: {
    views: number;
    timeSpent: number;
    rating: number;
  };
}

export interface CreateArticlePayload {
  title: string;
  content: string;
  author: string;
}