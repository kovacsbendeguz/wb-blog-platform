import { Handler } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { dbClient } from '../lib/dbClient';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const TABLE = process.env.TABLE_NAME!;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  try {
    // Query all articles
    const result = await dbClient.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: 'ARTICLE' }
      }
    }));
    
    const articles = (result.Items || []).map(item => unmarshall(item));
    
    const totalArticles = articles.length;
    const articlesWithMetrics = articles.filter(article => article.metrics);
    
    const topArticlesByViews = [...articlesWithMetrics]
      .sort((a, b) => (b.metrics?.views || 0) - (a.metrics?.views || 0))
      .slice(0, 5)
      .map(article => ({
        articleId: article.articleId,
        title: article.title,
        author: article.author,
        views: article.metrics?.views || 0
      }));
    
    const topArticlesByTimeSpent = [...articlesWithMetrics]
      .sort((a, b) => (b.metrics?.timeSpent || 0) - (a.metrics?.timeSpent || 0))
      .slice(0, 5)
      .map(article => ({
        articleId: article.articleId,
        title: article.title,
        author: article.author,
        timeSpent: article.metrics?.timeSpent || 0
      }));
    
    const topArticlesByRating = [...articlesWithMetrics]
      .filter(article => article.metrics?.rating)
      .sort((a, b) => (b.metrics?.rating || 0) - (a.metrics?.rating || 0))
      .slice(0, 5)
      .map(article => ({
        articleId: article.articleId,
        title: article.title,
        author: article.author,
        rating: article.metrics?.rating || 0
      }));
    
    const avgViews = articlesWithMetrics.reduce((sum, article) => sum + (article.metrics?.views || 0), 0) / 
      (articlesWithMetrics.length || 1);
    
    const avgTimeSpent = articlesWithMetrics.reduce((sum, article) => sum + (article.metrics?.timeSpent || 0), 0) / 
      (articlesWithMetrics.length || 1);
    
    const avgRating = articlesWithMetrics
      .filter(article => article.metrics?.rating)
      .reduce((sum, article) => sum + (article.metrics?.rating || 0), 0) / 
      (articlesWithMetrics.filter(article => article.metrics?.rating).length || 1);
    
    const authorArticleCounts = articles.reduce((acc, article) => {
      const author = article.author;
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topAuthors = Object.entries(authorArticleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([author, count]) => ({ author, articleCount: count }));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalArticles,
        topArticlesByViews,
        topArticlesByTimeSpent,
        topArticlesByRating,
        averageMetrics: {
          views: avgViews,
          timeSpent: avgTimeSpent,
          rating: avgRating
        },
        topAuthors
      })
    };
  } catch (error) {
    console.error('Error generating engagement stats:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};