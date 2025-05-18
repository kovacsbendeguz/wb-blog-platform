import { Stack, StackProps, CfnOutput, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { DatabaseStack } from './database-stack';
import { AuthStack } from './auth-stack';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export interface ApiStackProps extends StackProps {
  databaseStack: DatabaseStack;
  authStack: AuthStack;
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

    // Auth functions
    const signUpFn = new NodejsFunction(this, 'SignUpFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/auth/src/handlers/signUp.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.authStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.authStack.userPoolClient.userPoolClientId,
      },
    });

    const signInFn = new NodejsFunction(this, 'SignInFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/auth/src/handlers/signIn.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.authStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.authStack.userPoolClient.userPoolClientId,
      },
    });

    const confirmSignUpFn = new NodejsFunction(this, 'ConfirmSignUpFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/auth/src/handlers/confirmSignUp.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.authStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.authStack.userPoolClient.userPoolClientId,
      },
    });

    const forgotPasswordFn = new NodejsFunction(this, 'ForgotPasswordFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/auth/src/handlers/forgotPassword.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.authStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.authStack.userPoolClient.userPoolClientId,
      },
    });

    const resetPasswordFn = new NodejsFunction(this, 'ResetPasswordFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/auth/src/handlers/resetPassword.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.authStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.authStack.userPoolClient.userPoolClientId,
      },
    });

    const changePasswordFn = new NodejsFunction(this, 'ChangePasswordFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/auth/src/handlers/changePassword.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.authStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.authStack.userPoolClient.userPoolClientId,
      },
    });

    const getUserFn = new NodejsFunction(this, 'GetUserFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/auth/src/handlers/getUser.ts'),
      handler: 'handler',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.authStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.authStack.userPoolClient.userPoolClientId,
      },
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
      environment: { 
        TABLE_NAME: tableName,
        USER_POOL_ID: props.authStack.userPool.userPoolId,
      },
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

    // Create API Gateway
    const api = new apigw.RestApi(this, 'NewsApi', { 
      restApiName: 'News Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true
      }
    });
    
    // Create Cognito Authorizer
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'BlogAuthorizer', {
      cognitoUserPools: [props.authStack.userPool]
    });
    
    // Add auth routes
    const auth = api.root.addResource('auth');
    
    const signup = auth.addResource('signup');
    signup.addMethod('POST', new apigw.LambdaIntegration(signUpFn));
    
    const signin = auth.addResource('signin');
    signin.addMethod('POST', new apigw.LambdaIntegration(signInFn));
    
    const confirmSignup = auth.addResource('confirm');
    confirmSignup.addMethod('POST', new apigw.LambdaIntegration(confirmSignUpFn));
    
    const forgotPassword = auth.addResource('forgot-password');
    forgotPassword.addMethod('POST', new apigw.LambdaIntegration(forgotPasswordFn));
    
    const resetPassword = auth.addResource('reset-password');
    resetPassword.addMethod('POST', new apigw.LambdaIntegration(resetPasswordFn));
    
    const changePassword = auth.addResource('change-password');
    changePassword.addMethod('POST', new apigw.LambdaIntegration(changePasswordFn), {
      authorizer: authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });
    
    const user = auth.addResource('user');
    user.addMethod('GET', new apigw.LambdaIntegration(getUserFn), {
      authorizer: authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });
    
    // Add API routes
    const articles = api.root.addResource('articles');
    articles.addMethod('GET', new apigw.LambdaIntegration(getArticlesFn));
    
    // Protected route - only authenticated users can create articles
    articles.addMethod('POST', new apigw.LambdaIntegration(postArticleFn), {
      authorizer: authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });
    
    const articleById = articles.addResource('{id}');
    articleById.addMethod('GET', new apigw.LambdaIntegration(getArticlesFn));

    const metricsResource = articleById.addResource('metrics');
    metricsResource.addMethod('POST', new apigw.LambdaIntegration(updateMetricsFn));

    const analytics = api.root.addResource('analytics');
    const engagement = analytics.addResource('engagement');
    // Protected route - only authenticated users can see analytics
    engagement.addMethod('GET', new apigw.LambdaIntegration(getEngagementStatsFn), {
      authorizer: authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    const ingest = api.root.addResource('ingest');
    // Protected route - only authenticated users can trigger ingest
    ingest.addMethod('POST', new apigw.LambdaIntegration(rssIngestFn), {
      authorizer: authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

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