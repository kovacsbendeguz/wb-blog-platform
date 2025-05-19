import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const EmptyState = () => {
  const { t } = useTranslation();
  
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📝</div>
      <h3 className="empty-state-title">{t('articles.empty')}</h3>
      <p className="empty-state-description">
        {t('articles.emptyDescription', 'Start your journey by creating your first article!')}
      </p>
      <Link to="/create" className="empty-state-button">
        {t('navigation.create')}
      </Link>
    </div>
  );
};