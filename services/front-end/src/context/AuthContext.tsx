// services/front-end/src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthService, API_URL } from '../auth/service';

interface User {
  username: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, name?: string) => Promise<void>;
  confirmSignup: (username: string, code: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (username: string) => Promise<void>;
  resetPassword: (username: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  getUser: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState(AuthService.getInitialAuthState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user info on mount if we have tokens
  useEffect(() => {
    const loadUserData = async () => {
      if (authState.isAuthenticated && authState.tokens && !authState.user) {
        try {
          setIsLoading(true);
          const user = await AuthService.getUserInfo();
          setAuthState(prevState => ({ ...prevState, user }));
        } catch (err) {
          console.error('Failed to load user data:', err);
          // If we got an authentication error, clear the auth state
          if (err instanceof Error && (
            err.message.includes('Not authenticated') || 
            err.message.includes('401') ||
            err.message.includes('Session expired')
          )) {
            logout();
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserData();
  }, [authState.isAuthenticated, authState.tokens]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newAuthState = await AuthService.login(username, password);
      setAuthState(newAuthState);
      
      // Get user info
      const user = await AuthService.getUserInfo();
      setAuthState(prevState => ({ ...prevState, user }));
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setAuthState({ isAuthenticated: false, tokens: null, user: null });
  };

  const signup = async (username: string, email: string, password: string, name?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await AuthService.signup(username, email, password, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSignup = async (username: string, code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await AuthService.confirmSignup(username, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (username: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Implement this API call
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset code');
      }
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (username: string, code: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Implement this API call
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          confirmationCode: code, 
          newPassword 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!authState.tokens?.accessToken) {
      throw new Error('Not authenticated');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.tokens.accessToken}`,
        },
        body: JSON.stringify({ 
          previousPassword: oldPassword, 
          proposedPassword: newPassword 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getUser = async (): Promise<User> => {
    try {
      return await AuthService.getUserInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        isLoading,
        error,
        login,
        signup,
        confirmSignup,
        logout,
        forgotPassword,
        resetPassword,
        changePassword,
        getUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};