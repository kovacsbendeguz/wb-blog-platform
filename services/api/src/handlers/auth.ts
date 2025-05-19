import { APIGatewayProxyHandler } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminAddUserToGroupCommand,
  GetUserCommand,
  AdminGetUserCommand,
  GlobalSignOutCommand,
  ChangePasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;

// Check if environment variables are set
if (!USER_POOL_ID || !CLIENT_ID) {
  console.error(
    "Required environment variables are not set: USER_POOL_ID or USER_POOL_CLIENT_ID"
  );
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
  "Content-Type": "application/json",
};

// Sign up handler
export const signUp: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Credentials": true,
        },
        body: "",
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    // Add extensive logging
    console.log("SignUp handler called");
    console.log("SignUp request body:", event.body);
    console.log("USER_POOL_ID:", process.env.USER_POOL_ID);
    console.log("CLIENT_ID:", process.env.USER_POOL_CLIENT_ID);

    const { email, password, name } = JSON.parse(event.body);

    // Check if required fields are provided
    if (!email || !password || !name) {
      console.log("Missing required fields in request");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Missing required fields",
          requiredFields: ["email", "password", "name"],
        }),
      };
    }

    // Log the parameters before sending to Cognito
    console.log("Sending to Cognito with parameters:", {
      ClientId: process.env.USER_POOL_CLIENT_ID,
      Username: email,
      Password: "***", // Don't log the actual password
    });

    const command = new SignUpCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "name", Value: name },
        { Name: "role", Value: "user" },
        // { Name: "custom:role", Value: "user" },
      ],
    });

    try {
      const response = await cognitoClient.send(command);
      console.log("SignUp successful. Response:", JSON.stringify(response));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message:
            "User registration successful. Please check your email for confirmation code.",
          userSub: response.UserSub,
        }),
      };
    } catch (cognitoError) {
      console.error("Cognito API error:", cognitoError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Error during registration",
          error:
            cognitoError instanceof Error
              ? cognitoError.message
              : "Cognito API error",
          errorDetails: JSON.stringify(cognitoError),
        }),
      };
    }
  } catch (error) {
    console.error("Unhandled error in signUp:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Server error during registration",
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: JSON.stringify(error),
      }),
    };
  }
};

// Confirm registration handler
export const confirmSignUp: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Credentials": true,
        },
        body: "",
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const { email, confirmationCode } = JSON.parse(event.body);

    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Email confirmed successfully. You can now sign in.",
      }),
    };
  } catch (error) {
    console.error("Error in confirmSignUp:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error during confirmation",
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: JSON.stringify(error), // For debugging
      }),
    };
  }
};

// Sign in handler
export const signIn: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Credentials": true,
        },
        body: "",
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const { email, password } = JSON.parse(event.body);

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Sign in successful",
        tokens: {
          idToken: response.AuthenticationResult?.IdToken,
          accessToken: response.AuthenticationResult?.AccessToken,
          refreshToken: response.AuthenticationResult?.RefreshToken,
          expiresIn: response.AuthenticationResult?.ExpiresIn,
        },
      }),
    };
  } catch (error) {
    console.error("Error in signIn:", error);
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        message: "Authentication failed",
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: JSON.stringify(error), // For debugging
      }),
    };
  }
};

// Forgot password handler
export const forgotPassword: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Credentials": true,
        },
        body: "",
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const { email } = JSON.parse(event.body);

    const command = new ForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: email,
    });

    await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Password reset code sent to your email",
      }),
    };
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error during password reset request",
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: JSON.stringify(error), // For debugging
      }),
    };
  }
};

// Reset password handler
export const resetPassword: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Credentials": true,
        },
        body: "",
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const { email, confirmationCode, newPassword } = JSON.parse(event.body);

    const command = new ConfirmForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    });

    await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message:
          "Password reset successful. You can now sign in with your new password.",
      }),
    };
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error during password reset",
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: JSON.stringify(error), // For debugging
      }),
    };
  }
};

// Change password handler
export const changePassword: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Credentials": true,
        },
        body: "",
      };
    }

    const token = event.headers.Authorization?.replace("Bearer ", "");

    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Missing authorization token" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const { previousPassword, proposedPassword } = JSON.parse(event.body);

    const command = new ChangePasswordCommand({
      AccessToken: token,
      PreviousPassword: previousPassword,
      ProposedPassword: proposedPassword,
    });

    await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Password changed successfully",
      }),
    };
  } catch (error) {
    console.error("Error in changePassword:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error changing password",
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: JSON.stringify(error), // For debugging
      }),
    };
  }
};

// Sign out handler
export const signOut: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Credentials": true,
        },
        body: "",
      };
    }

    const token = event.headers.Authorization?.replace("Bearer ", "");

    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Missing authorization token" }),
      };
    }

    const command = new GlobalSignOutCommand({
      AccessToken: token,
    });

    await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Signed out successfully",
      }),
    };
  } catch (error) {
    console.error("Error in signOut:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error during sign out",
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: JSON.stringify(error), // For debugging
      }),
    };
  }
};

// Get user handler
export const getUser: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Credentials": true,
        },
        body: "",
      };
    }

    const token = event.headers.Authorization?.replace("Bearer ", "");

    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Missing authorization token" }),
      };
    }

    const command = new GetUserCommand({
      AccessToken: token,
    });

    const response = await cognitoClient.send(command);

    const user = {
      username: response.Username,
      attributes: response.UserAttributes?.reduce((acc, attr) => {
        if (attr.Name && attr.Value) {
          acc[attr.Name] = attr.Value;
        }
        return acc;
      }, {} as Record<string, string>),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ user }),
    };
  } catch (error) {
    console.error("Error in getUser:", error);
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        message: "Invalid or expired token",
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: JSON.stringify(error), // For debugging
      }),
    };
  }
};

// Set a user as admin
export const setUserAsAdmin: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Credentials": true,
        },
        body: "",
      };
    }

    // Verify the requester is an admin
    const token = event.headers.Authorization?.replace("Bearer ", "");

    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Missing authorization token" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const { username } = JSON.parse(event.body);

    const command = new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: "Admins",
    });

    await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `User ${username} successfully added to Admins group`,
      }),
    };
  } catch (error) {
    console.error("Error in setUserAsAdmin:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error setting user as admin",
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: JSON.stringify(error), // For debugging
      }),
    };
  }
};
