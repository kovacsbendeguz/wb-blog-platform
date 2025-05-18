// services/front-end/src/services/AuthService.ts
export const API_URL = "https://b5w4i622r3.execute-api.eu-central-1.amazonaws.com/prod";

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

interface User {
  username: string;
  email: string;
  role?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  tokens: AuthTokens | null;
  user: User | null;
}

// Initialize auth state from localStorage
const getInitialAuthState = (): AuthState => {
  try {
    const storedState = localStorage.getItem('authState');
    if (storedState) {
      return JSON.parse(storedState);
    }
  } catch (e) {
    console.error('Failed to parse stored auth state', e);
  }
  return { isAuthenticated: false, tokens: null, user: null };
};

// Save auth state to localStorage
const saveAuthState = (authState: AuthState): void => {
  localStorage.setItem('authState', JSON.stringify(authState));
};

// Clear auth state
const clearAuthState = (): void => {
  localStorage.removeItem('authState');
};

// Get auth headers for API requests
const getAuthHeaders = (): Record<string, string> => {
  const { tokens } = getInitialAuthState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }
  
  return headers;
};

// Login
const login = async (username: string, password: string): Promise<AuthState> => {
  const response = await fetch(`${API_URL}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }
  
  const data = await response.json();
  
  // Create new auth state
  const newAuthState: AuthState = {
    isAuthenticated: true,
    tokens: {
      accessToken: data.accessToken,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
    },
    user: null, // Will be fetched separately
  };
  
  // Save to localStorage
  saveAuthState(newAuthState);
  
  return newAuthState;
};

// Get user info
const getUserInfo = async (): Promise<User> => {
  const { tokens } = getInitialAuthState();
  
  if (!tokens?.accessToken) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_URL}/auth/user`, {
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
    },
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Clear auth state on 401 (unauthorized)
      clearAuthState();
      throw new Error('Session expired');
    }
    
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get user details');
  }
  
  const data = await response.json();
  
  // Update auth state with user details
  const currentState = getInitialAuthState();
  const updatedState = {
    ...currentState,
    user: data.user,
  };
  
  saveAuthState(updatedState);
  
  return data.user;
};

// Logout
const logout = (): void => {
  clearAuthState();
};

// Signup
const signup = async (username: string, email: string, password: string, name?: string): Promise<{ userSub: string }> => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password, name }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Signup failed');
  }
  
  return response.json();
};

// Confirm signup
const confirmSignup = async (username: string, code: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/auth/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, confirmationCode: code }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Confirmation failed');
  }
  
  return response.json();
};

// Export all functions
export const AuthService = {
  getInitialAuthState,
  getAuthHeaders,
  login,
  getUserInfo,
  logout,
  signup,
  confirmSignup,
};