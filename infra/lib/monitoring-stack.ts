import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as grafana from 'aws-cdk-lib/aws-grafana';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import { ApiStack } from './api-stack';
import { DatabaseStack } from './database-stack';

export interface MonitoringStackProps extends StackProps {
  apiStack: ApiStack;
  databaseStack: DatabaseStack;
}

export class MonitoringStack extends Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const grafanaRole = new iam.Role(this, 'GrafanaServiceRole', {
      assumedBy: new iam.ServicePrincipal('grafana.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXrayReadOnlyAccess'),
      ],
    });

    const workspace = new grafana.CfnWorkspace(this, 'NewsAnalyticsWorkspace', {
      accountAccessType: 'CURRENT_ACCOUNT',
      authenticationProviders: ['AWS_SSO'],
      permissionType: 'SERVICE_MANAGED',
      roleArn: grafanaRole.roleArn,
      name: 'NewsAnalytics',
    });

    const dashboard = new cloudwatch.Dashboard(this, 'NewsDashboard', {
      dashboardName: 'NewsServiceMetrics',
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              ApiName: 'NewsApi',
            },
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: {
              ApiName: 'NewsApi',
            },
            statistic: 'Average',
            period: Duration.minutes(1),
          }),
        ],
      }),
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: 'GetArticlesFn',
            },
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: 'PostArticleFn',
            },
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: 'RssIngestFn',
            },
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: 'GetArticlesFn',
            },
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: 'PostArticleFn',
            },
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: 'RssIngestFn',
            },
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
        ],
      }),
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensionsMap: {
              TableName: props.databaseStack.articlesTable.tableName,
            },
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            dimensionsMap: {
              TableName: props.databaseStack.articlesTable.tableName,
            },
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
        ],
      }),
    );

    const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: 'NewsApi',
        },
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      evaluationPeriods: 1,
      threshold: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'Alarm if the API Gateway returns 5XX errors',
    });

    new CfnOutput(this, 'GrafanaWorkspaceURL', {
      value: `https://${workspace.attrEndpoint}`,
      description: 'URL for the Grafana workspace',
    });

    new CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'URL for the CloudWatch dashboard',
    });
  }
}