import { signUp, signIn, confirmSignUp, forgotPassword, resetPassword } from '../../src/handlers/auth';
import { mockClient } from 'aws-sdk-client-mock';
import { 
  CognitoIdentityProviderClient, 
  SignUpCommand, 
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoMock = mockClient(CognitoIdentityProviderClient);

beforeEach(() => {
  cognitoMock.reset();
  process.env.USER_POOL_ID = 'test-user-pool-id';
  process.env.USER_POOL_CLIENT_ID = 'test-client-id';
});

describe('Auth handlers', () => {
  test('signUp handler registers a new user', async () => {
    cognitoMock.on(SignUpCommand).resolves({
      UserSub: 'test-user-id',
      CodeDeliveryDetails: {
        Destination: 't***@e***.com',
        DeliveryMedium: 'EMAIL',
        AttributeName: 'email'
      }
    });
    
    const event = {
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'Test User'
      })
    };
    
    const response = await signUp(event as any, {} as any, {} as any);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty('userSub', 'test-user-id');
    expect(JSON.parse(response.body)).toHaveProperty('message');
  });
  
  test('confirmSignUp handler confirms a registration', async () => {
    cognitoMock.on(ConfirmSignUpCommand).resolves({});
    
    const event = {
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({
        email: 'test@example.com',
        confirmationCode: '123456'
      })
    };
    
    const response = await confirmSignUp(event as any, {} as any, {} as any);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty('message');
  });
  
  test('signIn handler authenticates a user', async () => {
    cognitoMock.on(InitiateAuthCommand).resolves({
      AuthenticationResult: {
        IdToken: 'mock-id-token',
        AccessToken: 'mock-access-token',
        RefreshToken: 'mock-refresh-token',
        ExpiresIn: 3600
      }
    });
    
    const event = {
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
    };
    
    const response = await signIn(event as any, {} as any, {} as any);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).tokens).toHaveProperty('accessToken', 'mock-access-token');
    expect(JSON.parse(response.body).tokens).toHaveProperty('idToken', 'mock-id-token');
    expect(JSON.parse(response.body).tokens).toHaveProperty('refreshToken', 'mock-refresh-token');
  });

  test('forgotPassword handler sends a reset code', async () => {
    cognitoMock.on(ForgotPasswordCommand).resolves({});
    
    const event = {
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({
        email: 'test@example.com'
      })
    };
    
    const response = await forgotPassword(event as any, {} as any, {} as any);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty('message');
  });

  test('resetPassword handler resets a password', async () => {
    cognitoMock.on(ConfirmForgotPasswordCommand).resolves({});
    
    const event = {
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({
        email: 'test@example.com',
        confirmationCode: '123456',
        newPassword: 'NewTestPassword123!'
      })
    };
    
    const response = await resetPassword(event as any, {} as any, {} as any);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty('message');
  });

  test('signUp handler handles errors', async () => {
    cognitoMock.on(SignUpCommand).rejects(new Error('Test error'));
    
    const event = {
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'Test User'
      })
    };
    
    const response = await signUp(event as any, {} as any, {} as any);
    
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toHaveProperty('error', 'Test error');
  });
});