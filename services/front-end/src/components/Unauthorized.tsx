import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Unauthorized = () => {
  const { t } = useTranslation();
  
  return (
    <div className="unauthorized-container">
      <h2>{t('auth.unauthorized')}</h2>
      <p>{t('auth.unauthorizedMessage')}</p>
      <div className="unauthorized-actions">
        <Link to="/" className="auth-button">
          {t('auth.goHome')}
        </Link>
      </div>
    </div>
  );
};