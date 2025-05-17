import { Article, CreateArticlePayload } from "../types";

const API_URL =
  "https://og1xa3rd04.execute-api.eu-central-1.amazonaws.com/prod";

export const getArticles = async (): Promise<Article[]> => {
  try {
    const response = await fetch(`${API_URL}/articles`);

    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
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
