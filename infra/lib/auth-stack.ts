import { Stack, StackProps, CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';

export class AuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly authenticatedRole: iam.Role;
  public readonly unauthenticatedRole: iam.Role;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'BlogUserPool', {
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email for our Blog Platform',
        emailBody: 'Thanks for signing up! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      autoVerify: { email: true },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        fullname: {
          required: false,
          mutable: true,
        },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create User Pool Client
    this.userPoolClient = this.userPool.addClient('BlogUserPoolClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
      refreshTokenValidity: Duration.days(30),
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      preventUserExistenceErrors: true,
    });

    // Create Identity Pool
    this.identityPool = new cognito.CfnIdentityPool(this, 'BlogIdentityPool', {
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });

    // Create IAM roles
    this.authenticatedRole = new iam.Role(this, 'CognitoAuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    this.unauthenticatedRole = new iam.Role(this, 'CognitoUnauthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    // Attach roles to Identity Pool
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: this.authenticatedRole.roleArn,
        unauthenticated: this.unauthenticatedRole.roleArn,
      },
    });

    // Add minimal permissions to authenticated role
    this.authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-sync:*',
          'cognito-identity:*',
        ],
        resources: ['*'],
      })
    );

    // Add minimal permissions to unauthenticated role
    this.unauthenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-sync:*',
        ],
        resources: ['*'],
      })
    );

    // Outputs
    new CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'The ID of the User Pool',
    });

    new CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'The ID of the User Pool Client',
    });

    new CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      description: 'The ID of the Identity Pool',
    });

    new CfnOutput(this, 'Region', {
      value: this.region,
      description: 'The region in which the resources are deployed',
    });
  }
}