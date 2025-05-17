import { APIGatewayProxyHandler } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/client-dynamodb';
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
      const result = await dbClient.send(new ScanCommand({ TableName: TABLE }));
      const items = result.Items || [];
      const foundItem = items.find(item => 
        item.articleId && item.articleId.S === event.pathParameters!.id);
      
      if (!foundItem) {
        return { 
          statusCode: 404, 
          headers,
          body: JSON.stringify({ message: 'Article not found' }) 
        };
      }
      
      const unmarshalled = unmarshall(foundItem);
      
      return { 
        statusCode: 200, 
        headers,
        body: JSON.stringify(unmarshalled) 
      };
    }
    
    const result = await dbClient.send(new ScanCommand({ TableName: TABLE }));
    
    const unmarshalled = (result.Items || []).map(item => unmarshall(item));
    
    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify(unmarshalled) 
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