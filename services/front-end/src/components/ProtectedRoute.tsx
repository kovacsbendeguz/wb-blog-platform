import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthCt';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'author';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="loading">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page and save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for specific roles if required
  if (requiredRole) {
    const userGroups = user?.attributes?.['cognito:groups'] || '';
    const groups = userGroups.split(',');
    
    if (requiredRole === 'admin' && !groups.includes('Admins')) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    if (requiredRole === 'author' && !groups.includes('Authors') && !groups.includes('Admins')) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};