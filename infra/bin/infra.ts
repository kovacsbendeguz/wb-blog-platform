import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new App();

const dbStack = new DatabaseStack(app, 'DatabaseStack');

const apiStack = new ApiStack(app, 'ApiStack', { 
  databaseStack: dbStack 
});

new MonitoringStack(app, 'MonitoringStack', {
  apiStack,
  databaseStack: dbStack
});