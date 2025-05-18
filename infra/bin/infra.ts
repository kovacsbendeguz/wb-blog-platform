import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { AuthStack } from '../lib/auth-stack';

const app = new App();

const dbStack = new DatabaseStack(app, 'DatabaseStack');

const authStack = new AuthStack(app, 'AuthStack');

const apiStack = new ApiStack(app, 'ApiStack', { 
  databaseStack: dbStack,
  authStack: authStack
});

new MonitoringStack(app, 'MonitoringStack', {
  apiStack,
  databaseStack: dbStack
});