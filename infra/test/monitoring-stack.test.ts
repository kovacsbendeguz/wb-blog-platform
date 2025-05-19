import { describe, test, expect, beforeAll } from '@jest/globals';
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

describe('MonitoringStack', () => {
  let template: Template;
  
  beforeAll(() => {
    const app = new App();
    const dbStack = new DatabaseStack(app, 'TestDBStack');
    const apiStack = new ApiStack(app, 'TestApiStack', { databaseStack: dbStack });
    const monitoringStack = new MonitoringStack(app, 'TestMonitoringStack', {
      apiStack,
      databaseStack: dbStack
    });
    template = Template.fromStack(monitoringStack);
  });
  
  test('creates CloudWatch dashboard', () => {
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: 'NewsServiceMetrics'
    });
  });
  
  test('creates Grafana workspace', () => {
    template.resourceCountIs('AWS::Grafana::Workspace', 1);
    template.hasResourceProperties('AWS::Grafana::Workspace', {
      AccountAccessType: 'CURRENT_ACCOUNT',
      AuthenticationProviders: ['AWS_SSO'],
      PermissionType: 'SERVICE_MANAGED',
      Name: 'NewsAnalytics'
    });
  });
  
  test('creates IAM role for Grafana with correct permissions', () => {
    template.resourceCountIs('AWS::IAM::Role', 1);
    
    const roles = template.findResources('AWS::IAM::Role');
    const role = Object.values(roles)[0];
    
    expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
      .toEqual("grafana.amazonaws.com");
    
    expect(role.Properties.ManagedPolicyArns).toHaveLength(2);
  });
  
  test('creates CloudWatch alarms', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: '5XXError',
      ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      EvaluationPeriods: 1,
      Threshold: 5
    });
  });
  
  test('produces expected outputs', () => {
    template.hasOutput('GrafanaWorkspaceURL', {});
    template.hasOutput('DashboardURL', {});
  });
});