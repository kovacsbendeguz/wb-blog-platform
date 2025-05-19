import { Stack, StackProps, CfnOutput, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
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
      environment: { 
        TABLE_NAME: tableName,
        USER_POOL_ID: props.databaseStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.databaseStack.userPoolClient.userPoolClientId  
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

    const api = new apigw.RestApi(this, 'NewsApi', { 
      restApiName: 'News Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true
      }
    });

    // Create Cognito authorizer
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'BlogAuthorizer', {
      cognitoUserPools: [props.databaseStack.userPool],
    });
    
    // Auth Lambda Functions
    const signUpFn = new NodejsFunction(this, 'SignUpFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/auth.ts'),
      handler: 'signUp',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.databaseStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.databaseStack.userPoolClient.userPoolClientId
      },
    });

    const confirmSignUpFn = new NodejsFunction(this, 'ConfirmSignUpFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/auth.ts'),
      handler: 'confirmSignUp',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.databaseStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.databaseStack.userPoolClient.userPoolClientId
      },
    });

    const signInFn = new NodejsFunction(this, 'SignInFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/auth.ts'),
      handler: 'signIn',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.databaseStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.databaseStack.userPoolClient.userPoolClientId
      },
    });

    const forgotPasswordFn = new NodejsFunction(this, 'ForgotPasswordFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/auth.ts'),
      handler: 'forgotPassword',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.databaseStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.databaseStack.userPoolClient.userPoolClientId
      },
    });

    const resetPasswordFn = new NodejsFunction(this, 'ResetPasswordFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/auth.ts'),
      handler: 'resetPassword',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.databaseStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.databaseStack.userPoolClient.userPoolClientId
      },
    });

    const getUserFn = new NodejsFunction(this, 'GetUserFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/auth.ts'),
      handler: 'getUser',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.databaseStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.databaseStack.userPoolClient.userPoolClientId
      },
    });

    const setUserAsAdminFn = new NodejsFunction(this, 'SetUserAsAdminFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/api/src/handlers/auth.ts'),
      handler: 'setUserAsAdmin',
      depsLockFilePath: lockFile,
      environment: { 
        USER_POOL_ID: props.databaseStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.databaseStack.userPoolClient.userPoolClientId
      },
    });

    // Grant Cognito permissions to Lambda functions
    const cognitoPolicy = new iam.PolicyStatement({
      actions: [
        'cognito-idp:SignUp',
        'cognito-idp:ConfirmSignUp',
        'cognito-idp:InitiateAuth',
        'cognito-idp:RespondToAuthChallenge',
        'cognito-idp:ForgotPassword',
        'cognito-idp:ConfirmForgotPassword',
        'cognito-idp:GetUser',
        'cognito-idp:AdminAddUserToGroup',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminConfirmSignUp',
        'cognito-idp:AdminUserGlobalSignOut',
        'cognito-idp:ChangePassword',
        'cognito-idp:GlobalSignOut'
      ],
      resources: [props.databaseStack.userPool.userPoolArn]
    });

    signUpFn.addToRolePolicy(cognitoPolicy);
    confirmSignUpFn.addToRolePolicy(cognitoPolicy);
    signInFn.addToRolePolicy(cognitoPolicy);
    forgotPasswordFn.addToRolePolicy(cognitoPolicy);
    resetPasswordFn.addToRolePolicy(cognitoPolicy);
    getUserFn.addToRolePolicy(cognitoPolicy);
    setUserAsAdminFn.addToRolePolicy(cognitoPolicy);
    
    // Set up API routes
    // Articles
    const articles = api.root.addResource('articles');
    articles.addMethod('GET', new apigw.LambdaIntegration(getArticlesFn));
    articles.addMethod('POST', new apigw.LambdaIntegration(postArticleFn), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });
    
    const articleById = articles.addResource('{id}');
    articleById.addMethod('GET', new apigw.LambdaIntegration(getArticlesFn));

    const metricsResource = articleById.addResource('metrics');
    metricsResource.addMethod('POST', new apigw.LambdaIntegration(updateMetricsFn));

    // Analytics
    const analytics = api.root.addResource('analytics');
    const engagement = analytics.addResource('engagement');
    engagement.addMethod('GET', new apigw.LambdaIntegration(getEngagementStatsFn));
    
    // Admin analytics requires authorization
    const adminAnalytics = analytics.addResource('admin');
    adminAnalytics.addMethod('GET', new apigw.LambdaIntegration(getEngagementStatsFn), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    // Ingest
    const ingest = api.root.addResource('ingest');
    ingest.addMethod('POST', new apigw.LambdaIntegration(rssIngestFn), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    // Auth endpoints
    const auth = api.root.addResource('auth');

    const signUpResource = auth.addResource('signup');
    signUpResource.addMethod('POST', new apigw.LambdaIntegration(signUpFn));

    const confirmResource = auth.addResource('confirm');
    confirmResource.addMethod('POST', new apigw.LambdaIntegration(confirmSignUpFn));

    const signInResource = auth.addResource('signin');
    signInResource.addMethod('POST', new apigw.LambdaIntegration(signInFn));

    const forgotResource = auth.addResource('forgot-password');
    forgotResource.addMethod('POST', new apigw.LambdaIntegration(forgotPasswordFn));

    const resetResource = auth.addResource('reset-password');
    resetResource.addMethod('POST', new apigw.LambdaIntegration(resetPasswordFn));

    const userResource = auth.addResource('user');
    userResource.addMethod('GET', new apigw.LambdaIntegration(getUserFn), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    const adminResource = auth.addResource('set-admin');
    adminResource.addMethod('POST', new apigw.LambdaIntegration(setUserAsAdminFn), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    // Outputs
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