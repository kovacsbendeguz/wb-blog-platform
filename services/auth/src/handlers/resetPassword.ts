import { APIGatewayProxyHandler } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  ConfirmForgotPasswordCommand 
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

    const { username, confirmationCode, newPassword } = JSON.parse(event.body);
    
    if (!username || !confirmationCode || !newPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Username, confirmation code and new password are required' })
      };
    }

    const command = new ConfirmForgotPasswordCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username,
      ConfirmationCode: confirmationCode,
      Password: newPassword
    });
    
    await cognitoClient.send(command);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Password has been reset successfully'
      })
    };
  } catch (error) {
    console.error('Error in resetPassword:', error);
    
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