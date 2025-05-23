import { Article, CreateArticlePayload, ArticleMetrics } from "../types";

const API_URL =
  "https://zygx78ohoe.execute-api.eu-central-1.amazonaws.com/prod";

export const getArticles = async (limit: number = 10, nextToken?: string): Promise<{
  articles: Article[];
  nextToken: string | null;
}> => {
  try {
    let url = `${API_URL}/articles?limit=${limit}`;
    if (nextToken) {
      url += `&nextToken=${nextToken}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
};

export const createArticle = async (
  article: CreateArticlePayload
): Promise<Article> => {
  try {
    const response = await fetch(`${API_URL}/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      throw new Error(`Failed to create article: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error creating article:", error);
    throw error;
  }
};

export const getArticle = async (id: string): Promise<Article> => {
  try {
    const response = await fetch(`${API_URL}/articles/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching article ${id}:`, error);
    throw error;
  }
};

export const updateArticleMetrics = async (
  id: string,
  metrics: {
    incrementView?: boolean;
    timeSpent?: number;
    rating?: number;
  }
): Promise<{ message: string; metrics: ArticleMetrics }> => {
  try {
    console.log(`Updating metrics for article ${id}:`, metrics);
    
    const response = await fetch(`${API_URL}/articles/${id}/metrics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metrics),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update metrics: Status ${response.status}, Response:`, errorText);
      throw new Error(`Failed to update metrics: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating metrics for article ${id}:`, error);
    throw error;
  }
};

export const getEngagementStats = async (): Promise<{
  totalArticles: number;
  topArticlesByViews: Array<{ articleId: string; title: string; author: string; views: number }>;
  topArticlesByTimeSpent: Array<{ articleId: string; title: string; author: string; timeSpent: number }>;
  topArticlesByRating: Array<{ articleId: string; title: string; author: string; rating: number }>;
  averageMetrics: { views: number; timeSpent: number; rating: number };
  topAuthors: Array<{ author: string; articleCount: number }>;
}> => {
  try {
    const response = await fetch(`${API_URL}/analytics/engagement`);

    if (!response.ok) {
      throw new Error(`Failed to fetch engagement stats: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching engagement stats:", error);
    throw error;
  }
};

export const triggerIngest = async (): Promise<{
  message: string;
  articleIds: string[];
}> => {
  try {
    const response = await fetch(`${API_URL}/ingest`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger ingestion: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error triggering ingestion:", error);
    throw error;
  }
};