import { APIGatewayProxyHandler } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  ForgotPasswordCommand 
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({});
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Credentials': true,
        },
        body: ''
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Request body is required' })
      };
    }

    const { username } = JSON.parse(event.body);
    
    if (!username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Username is required' })
      };
    }

    const command = new ForgotPasswordCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username
    });
    
    await cognitoClient.send(command);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Password reset code has been sent to your email'
      })
    };
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      if (error.name === 'UserNotFoundException') {
        // For security, we still return a success response even if the user doesn't exist
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'Password reset code has been sent to your email'
          })
        };
      } else if (error.name === 'LimitExceededException') {
        statusCode = 429;
        errorMessage = 'Too many requests, please try again later';
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