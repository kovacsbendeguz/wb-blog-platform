import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import Parser from 'rss-parser';
import { v4 as uuid } from 'uuid';

const TABLE = process.env.TABLE_NAME!;
const RSS_FEED_URL = process.env.RSS_FEED_URL || 'https://news.ycombinator.com/rss';

const dynamoDb = new DynamoDBClient({});

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['description', 'description'],
      ['dc:creator', 'creator'],
      ['comments', 'commentsUrl']
    ]
  }
});

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

interface RssItem {
  title?: string;
  content?: string;
  contentEncoded?: string;
  contentSnippet?: string;
  description?: string;
  creator?: string;
  author?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  commentsUrl?: string;
}

const cleanHtmlContent = (html: string): string => {
  if (!html) return '';
  
  let content = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
  content = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
    
  content = content.replace(/^Comments$/i, '');
  
  return content;
};

const getBestContent = (item: RssItem): string => {
  if (item.contentEncoded && item.contentEncoded !== 'Comments') {
    return cleanHtmlContent(item.contentEncoded);
  }
  
  if (item.content && item.content !== 'Comments') {
    return cleanHtmlContent(item.content);
  }
  
  if (item.description && item.description !== 'Comments') {
    return cleanHtmlContent(item.description);
  }
  
  if (item.contentSnippet && item.contentSnippet !== 'Comments') {
    return item.contentSnippet;
  }
  
  if (item.title) {
    return `Article about ${item.title}. Full content available at source.`;
  }
  
  return 'Full article available at source link.';
};

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
      const articleId = uuid();
      const now = new Date().toISOString();
      const pubDate = item.isoDate || now;
      
      const author = item.creator || item.author || (feed.title ? `${feed.title} Feed` : 'RSS Import');
      
      const content = getBestContent(item);
      
      if (content.trim() === 'Comments') {
        console.log('Skipping item with only "Comments" text:', item.title);
        return null;
      }
      
      const article = {
        PK: 'ARTICLE',
        articleId,
        publishedAt: pubDate,
        title: item.title || 'Untitled',
        content,
        author,
        createdAt: now,
        sourceUrl: item.link || '',
        importedAt: now,
        metrics: {
          views: 0,
          timeSpent: 0,
          rating: 0
        }
      };
      
      console.log(`Importing article: ${article.title} with content starting with: ${content.substring(0, 100)}...`);
      
      const dbItem = marshall(article, { removeUndefinedValues: true });
      
      try {
        await dynamoDb.send(
          new PutItemCommand({
            TableName: TABLE,
            Item: dbItem
          })
        );
        return articleId;
      } catch (err) {
        console.error('Error importing item:', err);
        throw err;
      }
    });
    
    const importResults = await Promise.all(importPromises);
    const importedIds = importResults.filter(id => id !== null) as string[];
    
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