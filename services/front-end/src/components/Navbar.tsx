import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar = () => {
  const { t } = useTranslation();

  return (
    <nav className="navbar">
      <Link to="/">
        <h1>{t('app.title')}</h1>
      </Link>
      <div className="navbar-links">
        <Link to="/">{t('navigation.home')}</Link>
        <Link to="/create">{t('navigation.create')}</Link>
        <Link to="/analytics">{t('navigation.analytics')}</Link>
        <Link to="/admin">{t('navigation.admin')}</Link>
        <LanguageSwitcher />
      </div>
    </nav>
  );
};