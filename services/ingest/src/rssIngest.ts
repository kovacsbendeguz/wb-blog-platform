import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import Parser from 'rss-parser';
import { v4 as uuid } from 'uuid';

const TABLE = process.env.TABLE_NAME!;
const RSS_FEED_URL = process.env.RSS_FEED_URL || 'https://news.ycombinator.com/rss';

const dynamoDb = new DynamoDBClient({});
const parser = new Parser();

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

interface RssItem {
  title: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event && event.httpMethod === 'OPTIONS') {
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

  try {
    console.log(`Fetching RSS feed from ${RSS_FEED_URL}`);
    const feed = await parser.parseURL(RSS_FEED_URL);
    
    console.log(`Found ${feed.items.length} items in feed`);
    
    const importPromises = feed.items.map(async (item: RssItem) => {
      const article = {
        articleId: uuid(),
        title: item.title,
        content: item.content || item.contentSnippet || '',
        author: item.creator || 'RSS Import',
        publishedAt: item.isoDate || new Date().toISOString(),
        sourceUrl: item.link || '',
        importedAt: new Date().toISOString(),
      };
      
      const dbItem = marshall(article, { removeUndefinedValues: true });
      
      try {
        await dynamoDb.send(
          new PutItemCommand({
            TableName: TABLE,
            Item: dbItem,
            ConditionExpression: 'attribute_not_exists(articleId)'
          })
        );
        return article.articleId;
      } catch (err) {
        if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
          return article.articleId;
        }
        throw err;
      }
    });
    
    const importedIds = await Promise.all(importPromises);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `Successfully imported ${importedIds.length} articles`,
        articleIds: importedIds
      })
    };
  } catch (error) {
    console.error('Error importing RSS feed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Error importing RSS feed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};