import { Stack, StackProps, CfnOutput, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { DatabaseStack } from './database-stack';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export interface ApiStackProps extends StackProps {
  databaseStack: DatabaseStack;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const tableName = props.databaseStack.articlesTable.tableName;
    const lockFile = path.join(__dirname, '../../yarn.lock');

    const exportBucket = new s3.Bucket(this, 'ExportBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // GET /articles and GET /articles/{id}
    const getArticlesFn = new NodejsFunction(this, 'GetArticlesFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/getArticles.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { TABLE_NAME: tableName },
    });
    props.databaseStack.articlesTable.grantReadData(getArticlesFn);

    // POST /articles
    const postArticleFn = new NodejsFunction(this, 'PostArticleFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/postArticle.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { TABLE_NAME: tableName },
    });
    props.databaseStack.articlesTable.grantWriteData(postArticleFn);

    // POST /articles/{id}/metrics
    const updateMetricsFn = new NodejsFunction(this, 'UpdateMetricsFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/updateMetrics.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { TABLE_NAME: tableName },
    });
    props.databaseStack.articlesTable.grantReadWriteData(updateMetricsFn);

    // GET /analytics/engagement
    const getEngagementStatsFn = new NodejsFunction(this, 'GetEngagementStatsFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/getEngagementStats.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { TABLE_NAME: tableName },
    });
    props.databaseStack.articlesTable.grantReadData(getEngagementStatsFn);

    // Scheduled export job (10 UTC daily)
    const exportJobFn = new NodejsFunction(this, 'ExportJobFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/exportJob.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { 
        TABLE_NAME: tableName, 
        EXPORT_BUCKET: exportBucket.bucketName 
      },
    });
    props.databaseStack.articlesTable.grantReadData(exportJobFn);
    exportBucket.grantWrite(exportJobFn);

    // RSS Ingestion Lambda (hourly)
    const rssIngestFn = new NodejsFunction(this, 'RssIngestFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/ingest/src/rssIngest.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { 
        TABLE_NAME: tableName,
        RSS_FEED_URL: 'https://news.ycombinator.com/rss'
      },
      timeout: Duration.seconds(30)
    });
    props.databaseStack.articlesTable.grantWriteData(rssIngestFn);

    new events.Rule(this, 'DailyExportRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '10' }),
      targets: [new targets.LambdaFunction(exportJobFn)],
    });

    new events.Rule(this, 'HourlyRssIngestRule', {
      schedule: events.Schedule.cron({ minute: '0' }),
      targets: [new targets.LambdaFunction(rssIngestFn)],
    });

    const api = new apigw.RestApi(this, 'NewsApi', { 
      restApiName: 'News Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true
      }
    });
    
    const articles = api.root.addResource('articles');
    articles.addMethod('GET', new apigw.LambdaIntegration(getArticlesFn));
    articles.addMethod('POST', new apigw.LambdaIntegration(postArticleFn));
    
    const articleById = articles.addResource('{id}');
    articleById.addMethod('GET', new apigw.LambdaIntegration(getArticlesFn));

    const metricsResource = articleById.addResource('metrics');
    metricsResource.addMethod('POST', new apigw.LambdaIntegration(updateMetricsFn));

    const analytics = api.root.addResource('analytics');
    const engagement = analytics.addResource('engagement');
    engagement.addMethod('GET', new apigw.LambdaIntegration(getEngagementStatsFn));

    const ingest = api.root.addResource('ingest');
    ingest.addMethod('POST', new apigw.LambdaIntegration(rssIngestFn));

    new CfnOutput(this, 'ApiEndpoint', {
      value: api.urlForPath('/articles'),
      description: 'Base URL for the News API',
    });
    
    new CfnOutput(this, 'NewsApiEndpoint', {
      value: api.url,
      description: 'Base URL for the News API',
    });

    new CfnOutput(this, 'ExportBucketName', {
      value: exportBucket.bucketName,
      description: 'S3 Bucket for article exports',
    });
  }
}