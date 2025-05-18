import { APIGatewayProxyHandler } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  ConfirmSignUpCommand 
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

    const { username, confirmationCode } = JSON.parse(event.body);
    
    if (!username || !confirmationCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Username and confirmation code are required' })
      };
    }

    const command = new ConfirmSignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username,
      ConfirmationCode: confirmationCode
    });
    
    await cognitoClient.send(command);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Email confirmed successfully'
      })
    };
  } catch (error) {
    console.error('Error in confirmSignUp:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      if (error.name === 'CodeMismatchException') {
        statusCode = 400;
        errorMessage = 'Invalid confirmation code';
      } else if (error.name === 'ExpiredCodeException') {
        statusCode = 400;
        errorMessage = 'Confirmation code has expired';
      } else if (error.name === 'UserNotFoundException') {
        statusCode = 404;
        errorMessage = 'User not found';
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