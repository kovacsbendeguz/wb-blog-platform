import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Unauthorized = () => {
  const { t } = useTranslation();
  
  return (
    <div className="unauthorized-container">
      <h2>{t('auth.unauthorized')}</h2>
      <p>{t('auth.noPermission')}</p>
      <Link to="/" className="auth-button">
        {t('navigation.home')}
      </Link>
    </div>
  );
};