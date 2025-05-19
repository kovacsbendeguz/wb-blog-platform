import { User } from '../types';

const API_URL = "https://b5w4i622r3.execute-api.eu-central-1.amazonaws.com/prod";

export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
}

export interface ConfirmSignUpPayload {
  email: string;
  confirmationCode: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  previousPassword: string;
  proposedPassword: string;
}

export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Sign up a new user
export const signUp = async (payload: SignUpPayload): Promise<{ userSub: string; message: string }> => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sign up');
  }

  return response.json();
};

// Confirm a user's email after sign up
export const confirmSignUp = async (payload: ConfirmSignUpPayload): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/auth/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to confirm sign up');
  }

  return response.json();
};

// Sign in a user
export const signIn = async (payload: SignInPayload): Promise<{ tokens: AuthTokens; message: string }> => {
  const response = await fetch(`${API_URL}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sign in');
  }

  return response.json();
};

// Initiate a forgot password flow
export const forgotPassword = async (payload: ForgotPasswordPayload): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to initiate password reset');
  }

  return response.json();
};

// Reset a password with confirmation code
export const resetPassword = async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset password');
  }

  return response.json();
};

// Change password when logged in
export const changePassword = async (payload: ChangePasswordPayload, token: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }

  return response.json();
};

// Get the current user's info
export const getUser = async (token: string): Promise<{ user: User }> => {
  const response = await fetch(`${API_URL}/auth/user`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get user info');
  }

  return response.json();
};

// Sign out a user
export const signOut = async (token: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/auth/signout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sign out');
  }

  return response.json();
};