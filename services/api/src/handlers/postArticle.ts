import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { dbClient } from '../lib/dbClient';
import { v4 as uuid } from 'uuid';

const TABLE = process.env.TABLE_NAME!;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

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

    if (!event.body) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ message: 'Request body is required' }) 
      };
    }

    const data = JSON.parse(event.body);
    
    if (!data.title || !data.content || !data.author) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ 
          message: 'Missing required fields', 
          required: ['title', 'content', 'author'] 
        }) 
      };
    }

    const item = { 
      articleId: uuid(), 
      ...data, 
      publishedAt: new Date().toISOString() 
    };
    
    const dbItem = marshall(item, { removeUndefinedValues: true });
    
    await dbClient.send(new PutItemCommand({ 
      TableName: TABLE, 
      Item: dbItem 
    }));
    
    return { 
      statusCode: 201, 
      headers,
      body: JSON.stringify(item) 
    };
  } catch (err) {
    console.error('postArticle error:', err);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        message: 'Internal Server Error',
        error: err instanceof Error ? err.message : 'Unknown error'
      }) 
    };
  }
};