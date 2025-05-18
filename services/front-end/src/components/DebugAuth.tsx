// services/front-end/src/components/DebugAuth.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

export const DebugAuth = () => {
  const { isAuthenticated, user } = useAuth();
  
  const getStoredAuthState = () => {
    try {
      const stored = localStorage.getItem('authState');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (e) {
      return `Error parsing: ${e}`;
    }
  };
  
  const forceLogout = () => {
    localStorage.removeItem('authState');
    window.location.reload();
  };
  
  const storedState = getStoredAuthState();
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      padding: '10px', 
      background: '#f5f5f5', 
      border: '1px solid #ddd',
      zIndex: 1000,
      maxWidth: '300px',
      maxHeight: '200px',
      overflow: 'auto'
    }}>
      <h4>Auth Debug</h4>
      <p>
        <strong>isAuthenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
      </p>
      {user && (
        <p>
          <strong>User:</strong> {user.username} ({user.role || 'no role'})
        </p>
      )}
      <p>
        <strong>Token:</strong> {storedState?.tokens?.accessToken ? 
          `${storedState.tokens.accessToken.substring(0, 10)}...` : 
          'None'
        }
      </p>
      <button 
        onClick={forceLogout}
        style={{
          background: '#f44336',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px'
        }}
      >
        Force Logout
      </button>
    </div>
  );
};