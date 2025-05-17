import { Handler } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/client-dynamodb';
import { dbClient } from '../lib/dbClient';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const TABLE = process.env.TABLE_NAME!;
const BUCKET = process.env.EXPORT_BUCKET!;
const s3 = new S3Client({});

export const handler: Handler = async () => {
  const data = await dbClient.send(new ScanCommand({ TableName: TABLE }));
  const payload = JSON.stringify(data.Items);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `exports/${new Date().toISOString()}.json`,
    Body: payload,
  }));
};