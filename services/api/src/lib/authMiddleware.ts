import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const USER_POOL_ID = process.env.USER_POOL_ID!;
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;

// Create the verifier outside of the handler function for better performance
const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'access',
  clientId: CLIENT_ID,
});

interface User {
  sub: string;
  username?: string;
  email?: string; // Email might not be in the access token
  'cognito:groups'?: string[];
  'custom:role'?: string;
}

export interface AuthenticatedRequest extends APIGatewayProxyEvent {
  user?: User;
}

type HandlerFunction = (event: AuthenticatedRequest) => Promise<APIGatewayProxyResult>;

export const withAuth = (handler: HandlerFunction) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Handle preflight requests
      if (event.httpMethod === 'OPTIONS') {
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
          },
          body: '',
        };
      }

      // Get the token from the Authorization header
      const token = event.headers.Authorization?.split(' ')[1];
      if (!token) {
        return {
          statusCode: 401,
          body: JSON.stringify({ message: 'Unauthorized: No token provided' }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      // Verify the token
      const claims = await verifier.verify(token);
      
      // Add the user to the event object
      const authenticatedEvent: AuthenticatedRequest = {
        ...event,
        user: claims as unknown as User,
      };

      // Call the original handler with the authenticated event
      return await handler(authenticatedEvent);
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          message: 'Unauthorized: Invalid token',
          error: error instanceof Error ? error.message : 'Unknown authentication error'
        }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
  };
};

export const requireAdmin = (handler: HandlerFunction) => {
  return withAuth(async (event: AuthenticatedRequest) => {
    // Check if user is in admin group
    const isAdmin = event.user?.['cognito:groups']?.includes('Admins');
    
    if (!isAdmin) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Forbidden: Admin access required' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
    
    return await handler(event);
  });
};

export const requireAuthor = (handler: HandlerFunction) => {
  return withAuth(async (event: AuthenticatedRequest) => {
    // Check if user is in Authors group or Admins group
    const groups = event.user?.['cognito:groups'] || [];
    const isAuthorized = groups.includes('Authors') || groups.includes('Admins');
    
    if (!isAuthorized) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Forbidden: Author access required' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
    
    return await handler(event);
  });
};