import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  QueryCommand, 
  UpdateCommand,
  QueryCommandInput, 
  UpdateCommandInput 
} from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.TABLE_NAME!;
const GSI_NAME = 'ArticleIdIndex';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

interface ArticleMetrics {
  views: number;
  timeSpent: number;
  rating: number;
}

interface Article {
  PK: string;
  publishedAt: string;
  articleId: string;
  metrics?: ArticleMetrics;
  [key: string]: any;
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

    const queryParams: QueryCommandInput = {
      TableName: TABLE,
      IndexName: GSI_NAME,
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

    const article = queryResult.Items[0] as Article;
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

    const currentMetrics: ArticleMetrics = article.metrics || { views: 0, timeSpent: 0, rating: 0 };
    
    let newMetrics: ArticleMetrics;
    
    if (metricsData.incrementView) {
      newMetrics = {
        ...currentMetrics,
        views: (currentMetrics.views || 0) + 1
      };
    } else if (metricsData.timeSpent) {
      newMetrics = {
        ...currentMetrics,
        timeSpent: Math.round(((currentMetrics.timeSpent || 0) + metricsData.timeSpent) / 2)
      };
    } else if (metricsData.rating) {
      newMetrics = {
        ...currentMetrics,
        rating: metricsData.rating
      };
    } else {
      newMetrics = currentMetrics;
    }
    
    console.log('New metrics:', newMetrics);
    
    const updateParams: UpdateCommandInput = {
      TableName: TABLE,
      Key: {
        PK: article.PK,
        publishedAt: article.publishedAt
      },
      UpdateExpression: 'SET #metricsAttr = :metricsValue',
      ExpressionAttributeNames: {
        '#metricsAttr': 'metrics'
      },
      ExpressionAttributeValues: {
        ':metricsValue': newMetrics
      },
      ReturnValues: 'UPDATED_NEW'
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