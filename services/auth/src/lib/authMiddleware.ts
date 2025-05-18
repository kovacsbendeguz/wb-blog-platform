import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  GetUserCommand 
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({});

export interface AuthenticatedRequest extends APIGatewayProxyEvent {
  user?: {
    username: string;
    email: string;
    sub: string;
    role?: string;
  };
}

export const validateToken = async (event: APIGatewayProxyEvent): Promise<AuthenticatedRequest> => {
  const authEvent = event as AuthenticatedRequest;
  
  // Check if Authorization header exists
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader) {
    throw new Error('Authorization header is missing');
  }

  // Get token from header
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Verify token with Cognito
    const command = new GetUserCommand({
      AccessToken: token
    });
    
    const response = await cognitoClient.send(command);
    
    // Extract user attributes
    const attributes = response.UserAttributes?.reduce((acc, attr) => {
      if (attr.Name && attr.Value) {
        acc[attr.Name] = attr.Value;
      }
      return acc;
    }, {} as Record<string, string>) || {};
    
    // Add user object to request
    authEvent.user = {
      username: response.Username || '',
      email: attributes.email || '',
      sub: attributes.sub || '',
      role: attributes['custom:role']
    };
    
    return authEvent;
  } catch (error) {
    console.error('Error validating token:', error);
    throw new Error('Invalid or expired token');
  }
};

export const requireAuth = (
  handler: (event: AuthenticatedRequest) => Promise<APIGatewayProxyResult>
) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const authEvent = await validateToken(event);
      return await handler(authEvent);
    } catch (error) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          message: error instanceof Error ? error.message : 'Unauthorized'
        })
      };
    }
  };
};

export const requireRole = (role: string) => {
  return (handler: (event: AuthenticatedRequest) => Promise<APIGatewayProxyResult>) => {
    return requireAuth(async (event: AuthenticatedRequest) => {
      if (event.user?.role !== role) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify({
            message: 'Forbidden: Insufficient permissions'
          })
        };
      }
      
      return handler(event);
    });
  };
};