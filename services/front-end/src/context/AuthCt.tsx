import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getUser, signIn, signOut } from '../api/auth';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKENS_STORAGE_KEY = 'blog_auth_tokens';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
    tokens: {
      accessToken: null,
      idToken: null,
      refreshToken: null,
      expiresAt: null,
    },
  });

  useEffect(() => {
    // Check for tokens in localStorage
    const loadTokens = async () => {
      try {
        const storedTokens = localStorage.getItem(TOKENS_STORAGE_KEY);
        
        if (!storedTokens) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const tokens = JSON.parse(storedTokens);
        
        // Check if tokens are expired
        if (tokens.expiresAt && tokens.expiresAt < Date.now()) {
          localStorage.removeItem(TOKENS_STORAGE_KEY);
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false,
            isAuthenticated: false,
            tokens: {
              accessToken: null,
              idToken: null,
              refreshToken: null,
              expiresAt: null,
            }
          }));
          return;
        }

        // If we have a valid token, get the user info
        if (tokens.accessToken) {
          try {
            const { user } = await getUser(tokens.accessToken);
            setAuthState({
              isAuthenticated: true,
              user,
              isLoading: false,
              error: null,
              tokens: {
                accessToken: tokens.accessToken,
                idToken: tokens.idToken,
                refreshToken: tokens.refreshToken,
                expiresAt: tokens.expiresAt,
              },
            });
          } catch (error) {
            // If getting user fails, clear tokens
            localStorage.removeItem(TOKENS_STORAGE_KEY);
            setAuthState(prev => ({ 
              ...prev, 
              isLoading: false,
              isAuthenticated: false,
              error: error instanceof Error ? error.message : 'Failed to authenticate',
              tokens: {
                accessToken: null,
                idToken: null,
                refreshToken: null,
                expiresAt: null,
              }
            }));
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading authentication state:', error);
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error loading authentication'
        }));
      }
    };

    loadTokens();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await signIn({ email, password });
      
      if (!response.tokens) {
        throw new Error('No tokens received');
      }

      const { accessToken, idToken, refreshToken, expiresIn } = response.tokens;
      
      // Calculate expiration time
      const expiresAt = Date.now() + (expiresIn * 1000);
      
      // Store tokens
      const tokensToStore = {
        accessToken,
        idToken,
        refreshToken,
        expiresAt
      };
      
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokensToStore));

      // Get user info with the new token
      const { user } = await getUser(accessToken);
      
      setAuthState({
        isAuthenticated: true,
        user,
        isLoading: false,
        error: null,
        tokens: tokensToStore
      });
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      if (authState.tokens.accessToken) {
        await signOut(authState.tokens.accessToken);
      }
      
      localStorage.removeItem(TOKENS_STORAGE_KEY);
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        tokens: {
          accessToken: null,
          idToken: null,
          refreshToken: null,
          expiresAt: null,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we'll still log the user out locally
      localStorage.removeItem(TOKENS_STORAGE_KEY);
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
        tokens: {
          accessToken: null,
          idToken: null,
          refreshToken: null,
          expiresAt: null,
        },
      });
    }
  };

  const updateUser = (user: User) => {
    setAuthState(prev => ({ ...prev, user }));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};