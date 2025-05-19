import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '../context/AuthCt';

export const Navbar = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Check for admin role
  const isAdmin = user?.attributes?.['cognito:groups']?.includes('Admins');
  
  // Check for author role (either explicitly an Author or an Admin can author)
  const canAuthor = user?.attributes?.['cognito:groups']?.includes('Authors') || isAdmin;

  return (
    <nav className="navbar">
      <Link to="/">
        <h1>{t('app.title')}</h1>
      </Link>
      <div className="navbar-links">
        <Link to="/">{t('navigation.home')}</Link>
        
        {canAuthor && (
          <Link to="/create">{t('navigation.create')}</Link>
        )}
        
        {isAuthenticated && (
          <Link to="/analytics">{t('navigation.analytics')}</Link>
        )}
        
        {isAdmin && (
          <Link to="/admin">{t('navigation.admin')}</Link>
        )}
        
        {isLoading ? (
          <span className="auth-loading">...</span>
        ) : isAuthenticated ? (
          <div className="auth-user-menu">
            <span className="auth-user">
              {user?.attributes?.name || user?.username}
            </span>
            <div className="auth-dropdown">
              <Link to="/profile" className="auth-profile-link">
                {t('auth.profile')}
              </Link>
              <button onClick={handleLogout} className="auth-logout-button">
                {t('auth.logout')}
              </button>
            </div>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="auth-login-button">
              {t('auth.login')}
            </Link>
            <Link to="/register" className="auth-register-button">
              {t('auth.register')}
            </Link>
          </div>
        )}
        
        <LanguageSwitcher />
      </div>
    </nav>
  );
};