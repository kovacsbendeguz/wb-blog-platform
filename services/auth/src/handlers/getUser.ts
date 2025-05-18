import { APIGatewayProxyHandler } from 'aws-lambda';
import { requireAuth, AuthenticatedRequest } from '../lib/authMiddleware';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json'
};

const getUserHandler = async (event: AuthenticatedRequest) => {
  try {
    // The user object comes from the middleware
    const user = event.user;
    
    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'User not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: {
          username: user.username,
          email: user.email,
          role: user.role || 'user'
        }
      })
    };
  } catch (error) {
    console.error('Error in getUser:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : 'Internal server error'
      })
    };
  }
};

export const handler: APIGatewayProxyHandler = (event) => {
  return requireAuth(getUserHandler)(event);
};