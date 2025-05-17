import { Handler } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { dbClient } from '../lib/dbClient';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const TABLE = process.env.TABLE_NAME!;
const BUCKET = process.env.EXPORT_BUCKET!;
const s3 = new S3Client({});

export const handler: Handler = async () => {
  try {
    const data = await dbClient.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: 'ARTICLE' }
      }
    }));
    
    const articles = (data.Items || []).map(item => unmarshall(item));
    const payload = JSON.stringify(articles);
    
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `exports/${new Date().toISOString()}.json`,
      Body: payload,
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Export completed successfully',
        articleCount: articles.length
      })
    };
  } catch (error) {
    console.error('Error during export job:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Export failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};