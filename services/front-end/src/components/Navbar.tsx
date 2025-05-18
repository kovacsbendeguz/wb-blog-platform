import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/">
        <h1>{t('app.title')}</h1>
      </Link>
      <div className="navbar-links">
        <Link to="/">{t('navigation.home')}</Link>
        
        {isAuthenticated ? (
          <>
            <Link to="/create">{t('navigation.create')}</Link>
            <Link to="/analytics">{t('navigation.analytics')}</Link>
            {user?.role === 'admin' && (
              <Link to="/admin">{t('navigation.admin')}</Link>
            )}
            <div className="auth-dropdown">
              <button className="auth-dropdown-button">
                {user?.username || t('auth.account')}
              </button>
              <div className="auth-dropdown-content">
                <Link to="/profile">{t('auth.profile')}</Link>
                <button onClick={logout} className="dropdown-logout">
                  {t('auth.logout')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <Link to="/signin" className="signin-button">
            {t('auth.signIn')}
          </Link>
        )}
        
        <LanguageSwitcher />
      </div>
    </nav>
  );
};