import { QueryClient } from '@tanstack/react-query';

// Create a function to handle unauthorized responses
export const setupAuthInterceptor = (queryClient: QueryClient) => {
  // Check for 401 responses and trigger logout if needed
  const originalFetch = window.fetch;
  window.fetch = async function (resource, options) {
    const response = await originalFetch(resource, options);
    
    if (response.status === 401) {
      // Clear auth state from localStorage
      localStorage.removeItem('authState');
      
      // Clear all queries from React Query cache
      queryClient.clear();
      
      // Force reload of the page to reset application state
      if (window.location.pathname !== '/signin') {
        window.location.href = '/signin';
      }
    }
    
    return response;
  };
};