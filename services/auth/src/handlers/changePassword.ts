import { APIGatewayProxyHandler } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  ChangePasswordCommand 
} from "@aws-sdk/client-cognito-identity-provider";
import { requireAuth, AuthenticatedRequest } from '../lib/authMiddleware';

const cognitoClient = new CognitoIdentityProviderClient({});

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

const changePasswordHandler = async (event: AuthenticatedRequest) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Request body is required' })
      };
    }

    const { previousPassword, proposedPassword } = JSON.parse(event.body);
    
    if (!previousPassword || !proposedPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Previous password and proposed password are required' })
      };
    }

    // The token comes from the middleware
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const accessToken = authHeader?.replace('Bearer ', '') || '';

    const command = new ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: previousPassword,
      ProposedPassword: proposedPassword
    });
    
    await cognitoClient.send(command);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Password changed successfully'
      })
    };
  } catch (error) {
    console.error('Error in changePassword:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      if (error.name === 'NotAuthorizedException') {
        statusCode = 401;
        errorMessage = 'Incorrect password';
      } else if (error.name === 'InvalidPasswordException') {
        statusCode = 400;
        errorMessage = 'Password does not meet requirements';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({
        message: errorMessage
      })
    };
  }
};

export const handler: APIGatewayProxyHandler = (event) => {
  return requireAuth(changePasswordHandler)(event);
};