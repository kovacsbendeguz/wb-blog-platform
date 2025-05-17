import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { dbClient } from '../lib/dbClient';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const TABLE = process.env.TABLE_NAME!;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.pathParameters && event.pathParameters.id) {
      const articleId = event.pathParameters.id;
      
      const result = await dbClient.send(new QueryCommand({
        TableName: TABLE,
        IndexName: 'ArticleIdIndex',
        KeyConditionExpression: 'articleId = :articleId',
        ExpressionAttributeValues: {
          ':articleId': { S: articleId }
        },
        Limit: 1
      }));

      if (!result.Items || result.Items.length === 0) {
        return { 
          statusCode: 404, 
          headers,
          body: JSON.stringify({ message: 'Article not found' }) 
        };
      }
      
      const article = unmarshall(result.Items[0]);
      
      // if (!article.metrics) {
      //   article.metrics = { views: 1, timeSpent: 0, rating: 0 };
      // } else {
      //   article.metrics.views = (article.metrics.views || 0) + 1;
      // }
      
      return { 
        statusCode: 200, 
        headers,
        body: JSON.stringify(article) 
      };
    }
    
    const limit = event.queryStringParameters?.limit ? 
      parseInt(event.queryStringParameters.limit) : 10;
    const lastEvaluatedKey = event.queryStringParameters?.nextToken ? 
      JSON.parse(decodeURIComponent(event.queryStringParameters.nextToken)) : undefined;
    
    const queryParams = {
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: 'ARTICLE' }
      },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey
    };
    
    const result = await dbClient.send(new QueryCommand(queryParams));
    
    const articles = (result.Items || []).map(item => unmarshall(item));
    
    const response = {
      articles,
      nextToken: result.LastEvaluatedKey ? 
        encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null
    };
    
    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify(response) 
    };
  } catch (error) {
    console.error('Error in getArticles:', error);
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