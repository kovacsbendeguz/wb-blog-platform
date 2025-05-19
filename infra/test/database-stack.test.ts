import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DatabaseStack } from '../lib/database-stack';

describe('DatabaseStack', () => {
  test('creates DynamoDB table with correct properties', () => {
    const app = new App();
    const stack = new DatabaseStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::DynamoDB::Table', 1);

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'publishedAt', KeyType: 'RANGE' }
      ],
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true }
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'ArticleIdIndex',
          KeySchema: [{ AttributeName: 'articleId', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' }
        }
      ]
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'publishedAt', AttributeType: 'S' },
        { AttributeName: 'articleId', AttributeType: 'S' }
      ]
    });

    template.hasResource('AWS::DynamoDB::Table', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete'
    });
  });
});
