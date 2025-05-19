import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.TABLE_NAME || '';
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

interface ArticleMetrics {
  views: number;
  timeSpent: number;
  rating: number;
  ratingCount?: number;
  totalRating?: number;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Credentials': true,
        },
        body: ''
      };
    }

    if (!event.pathParameters?.id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Article ID is required' })
      };
    }

    const articleId = event.pathParameters.id;

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Request body is required' })
      };
    }

    const metricsData = JSON.parse(event.body);
    console.log(`Updating metrics for article ${articleId}:`, metricsData);

    const queryParams = {
      TableName: TABLE,
      IndexName: 'ArticleIdIndex',
      KeyConditionExpression: 'articleId = :articleId',
      ExpressionAttributeValues: {
        ':articleId': articleId
      }
    };

    const queryResult = await docClient.send(new QueryCommand(queryParams));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Article not found' })
      };
    }

    const article = queryResult.Items[0];
    console.log('Found article:', article);

    if (!article.PK || !article.publishedAt) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          message: 'Article does not have the expected key attributes',
          articleKeys: Object.keys(article)
        })
      };
    }

    const currentMetrics: ArticleMetrics = article.metrics || { 
      views: 0, 
      timeSpent: 0, 
      rating: 0,
      ratingCount: 0,
      totalRating: 0
    };
    
    let newMetrics: ArticleMetrics = { ...currentMetrics };
    let updateExpression = 'SET #metricsAttr = :metricsValue';
    
    if (metricsData.incrementView) {
      newMetrics.views = (currentMetrics.views || 0) + 1;
    } 
    
    if (metricsData.timeSpent) {
      newMetrics.timeSpent = (currentMetrics.timeSpent || 0) + metricsData.timeSpent;
    } 
    
    if (metricsData.rating) {
      const newRatingCount = (currentMetrics.ratingCount || 0) + 1;
      const newTotalRating = (currentMetrics.totalRating || 0) + metricsData.rating;
      
      const newAvgRating = newTotalRating / newRatingCount;
      
      newMetrics.rating = Math.round(newAvgRating * 10) / 10;
      newMetrics.ratingCount = newRatingCount;
      newMetrics.totalRating = newTotalRating;
    }
    
    console.log('New metrics:', newMetrics);
    
    const updateParams = {
      TableName: TABLE,
      Key: {
        PK: article.PK,
        publishedAt: article.publishedAt
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        '#metricsAttr': 'metrics'
      },
      ExpressionAttributeValues: {
        ':metricsValue': newMetrics
      },
      ReturnValues: 'UPDATED_NEW' as const
    };
    
    const updateResult = await docClient.send(new UpdateCommand(updateParams));
    console.log('Update result:', updateResult);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Metrics updated successfully',
        metrics: newMetrics
      })
    };
  } catch (error) {
    console.error('Error updating metrics:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      })
    };
  }
};