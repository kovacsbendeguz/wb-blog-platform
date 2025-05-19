import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';

describe('ApiStack', () => {
  let template: Template;
  
  beforeAll(() => {
    const app = new App();
    const dbStack = new DatabaseStack(app, 'TestDBStack');
    const apiStack = new ApiStack(app, 'TestApiStack', { databaseStack: dbStack });
    template = Template.fromStack(apiStack);
  });
  
  test('creates API Gateway REST API', () => {
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'News Service',
      EndpointConfiguration: { Types: ['EDGE'] }
    });
    template.resourceCountIs('AWS::ApiGateway::Resource', 4);
    template.resourceCountIs('AWS::ApiGateway::Method', 6);
  });
  
  test('creates Lambda functions with appropriate permissions', () => {
    template.resourceCountIs('AWS::Lambda::Function', 6);
    const functions = template.findResources('AWS::Lambda::Function');
    Object.values(functions).forEach(fn => {
      expect(fn.Properties.Runtime).toEqual('nodejs18.x');
    });
    template.resourceCountIs('AWS::IAM::Role', 6);
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: expect.arrayContaining([
          expect.objectContaining({
            Action: expect.arrayContaining(['dynamodb:*']),
            Effect: 'Allow'
          })
        ])
      }
    });
  });
  
  test('creates S3 bucket for exports', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: expect.objectContaining({
        Rules: expect.arrayContaining([
          expect.objectContaining({ Status: 'Enabled' })
        ])
      })
    });
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: expect.arrayContaining([
          expect.objectContaining({
            Action: expect.arrayContaining(['s3:PutObject']),
            Effect: 'Allow'
          })
        ])
      }
    });
  });
  
  test('creates scheduled jobs correctly', () => {
    template.resourceCountIs('AWS::Events::Rule', 2);
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 10 * * ? *)'
    });
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 * * * ? *)'
    });
    template.resourceCountIs('AWS::Events::Target', 2);
  });
  
  test('produces expected outputs', () => {
    template.hasOutput('ApiEndpoint', {});
    template.hasOutput('NewsApiEndpoint', {});
    template.hasOutput('ExportBucketName', {});
  });
});
