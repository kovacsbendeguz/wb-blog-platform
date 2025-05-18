import { APIGatewayProxyHandler } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand 
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

    const { username, password } = JSON.parse(event.body);
    
    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Username and password are required' })
      };
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    });
    
    const response = await cognitoClient.send(command);
    
    const authResult = response.AuthenticationResult;
    
    if (!authResult) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          message: 'Authentication failed'
        })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Sign in successful',
        idToken: authResult.IdToken,
        accessToken: authResult.AccessToken,
        refreshToken: authResult.RefreshToken,
        expiresIn: authResult.ExpiresIn,
        tokenType: authResult.TokenType
      })
    };
  } catch (error) {
    console.error('Error in signIn:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      if (error.name === 'NotAuthorizedException') {
        statusCode = 401;
        errorMessage = 'Incorrect username or password';
      } else if (error.name === 'UserNotFoundException') {
        statusCode = 401; // Using 401 rather than 404 for security
        errorMessage = 'Incorrect username or password';
      } else if (error.name === 'UserNotConfirmedException') {
        statusCode = 400;
        errorMessage = 'User is not confirmed';
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