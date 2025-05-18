import { APIGatewayProxyHandler } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  SignUpCommand,
  SignUpCommandInput 
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

    const { username, password, email, name } = JSON.parse(event.body);
    
    if (!username || !password || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Username, password, and email are required' })
      };
    }

    const params: SignUpCommandInput = {
      ClientId: USER_POOL_CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        }
      ]
    };

    if (name) {
      params.UserAttributes?.push({
        Name: 'name',
        Value: name
      });
    }
    
    const command = new SignUpCommand(params);
    const response = await cognitoClient.send(command);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'User registration successful',
        userConfirmed: response.UserConfirmed,
        userSub: response.UserSub
      })
    };
  } catch (error) {
    console.error('Error in signUp:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      // Handle specific Cognito error codes
      if (error.name === 'UsernameExistsException') {
        statusCode = 409;
        errorMessage = 'Username already exists';
      } else if (error.name === 'InvalidPasswordException') {
        statusCode = 400;
        errorMessage = 'Password does not meet requirements';
      } else if (error.name === 'InvalidParameterException') {
        statusCode = 400;
        errorMessage = 'Invalid parameters provided';
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