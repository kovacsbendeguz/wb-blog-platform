import { describe, test, expect, beforeAll } from '@jest/globals';
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
      Name: 'News Service'
    });
    template.resourceCountIs('AWS::ApiGateway::Resource', 6);
    template.resourceCountIs('AWS::ApiGateway::Method', 13);
  });
  
  test('creates Lambda functions with appropriate permissions', () => {
    template.resourceCountIs('AWS::Lambda::Function', 7);
    
    template.resourceCountIs('AWS::Lambda::Function', 7);
    
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: ["dynamodb:BatchGetItem","dynamodb:GetRecords","dynamodb:GetShardIterator","dynamodb:Query","dynamodb:GetItem","dynamodb:Scan","dynamodb:ConditionCheckItem","dynamodb:DescribeTable"],
            Effect: "Allow"
          }
        ]
      }
    });
  });
  
  test('creates S3 bucket for exports', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    
    let found = false;
    const policies = template.findResources('AWS::IAM::Policy');
    
    Object.values(policies).forEach(policy => {
      const statements = policy.Properties.PolicyDocument.Statement;
      statements.forEach((statement: any) => {
        if (Array.isArray(statement.Action)) {
          if (statement.Action.includes('s3:PutObject')) {
            found = true;
          }
        } else if (statement.Action === 's3:PutObject') {
          found = true;
        }
      });
    });
    
    expect(found).toBe(true);
  });
  
  test('creates scheduled jobs correctly', () => {
    template.resourceCountIs('AWS::Events::Rule', 2);
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 10 * * ? *)'
    });
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 * * * ? *)'
    });
  });
  
  test('produces expected outputs', () => {
    template.hasOutput('ApiEndpoint', {});
    template.hasOutput('NewsApiEndpoint', {});
    template.hasOutput('ExportBucketName', {});
  });
});