import { Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as cdk from "aws-cdk-lib";

export class DatabaseStack extends Stack {
  public readonly articlesTable: dynamodb.Table;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Articles Table
    this.articlesTable = new dynamodb.Table(this, "ArticlesTable", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "publishedAt", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    this.articlesTable.addGlobalSecondaryIndex({
      indexName: "ArticleIdIndex",
      partitionKey: { name: "articleId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'BlogUserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        'role': new cognito.StringAttribute({ mutable: true }),
      },
      removalPolicy: RemovalPolicy.DESTROY, // For dev/test environments
    });

    // Create app client
    this.userPoolClient = this.userPool.addClient('BlogAppClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      // Remove oAuth settings since we're not using the hosted UI
      accessTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      generateSecret: false, // Set to false for JavaScript applications
    });

    // Create admin group
    const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Admins',
      description: 'Administrator group with full access',
      precedence: 0,
    });

    // Create authors group
    const authorGroup = new cognito.CfnUserPoolGroup(this, 'AuthorGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Authors',
      description: 'Authors who can publish content',
      precedence: 1,
    });

    // Outputs
    new CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'The ID of the Cognito User Pool',
    });

    new CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'The ID of the Cognito User Pool Client',
    });
  }
}