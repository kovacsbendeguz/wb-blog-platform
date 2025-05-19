import { useQuery } from '@tanstack/react-query';
import { getEngagementStats } from '../api/articles';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthCt';

export const Analytics = () => {
  const { t } = useTranslation();
  const { tokens, isAuthenticated } = useAuth();
  
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['engagementStats'],
    queryFn: () => getEngagementStats(tokens.accessToken || undefined),
  });

  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <h2>{t('analytics.authRequired')}</h2>
        <p>{t('analytics.loginToView')}</p>
        <Link to="/login" className="auth-button">{t('auth.login')}</Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="loading">{t('articles.loading')}</div>;
  }

  if (error) {
    return <div className="error">Error loading analytics: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }

  if (!stats) {
    return <div className="error">No analytics data available</div>;
  }

  return (
    <div className="analytics-page">
      <h2>{t('analytics.title')}</h2>
      
      <div className="analytics-summary">
        <div className="summary-card">
          <h3>{t('analytics.totalArticles')}</h3>
          <div className="summary-value">{stats.totalArticles}</div>
        </div>
        
        <div className="summary-card">
          <h3>{t('analytics.averageViews')}</h3>
          <div className="summary-value">{stats.averageMetrics.views.toFixed(1)}</div>
        </div>
        
        <div className="summary-card">
          <h3>{t('analytics.averageTimeSpent')}</h3>
          <div className="summary-value">{stats.averageMetrics.timeSpent.toFixed(0)} {t('detail.metrics.seconds')}</div>
        </div>
        
        <div className="summary-card">
          <h3>{t('analytics.averageRating')}</h3>
          <div className="summary-value">⭐ {stats.averageMetrics.rating.toFixed(1)}</div>
        </div>
      </div>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>{t('analytics.topArticlesByViews')}</h3>
          <ul className="analytics-list">
            {stats.topArticlesByViews.map(article => (
              <li key={article.articleId} className="analytics-list-item">
                <Link to={`/articles/${article.articleId}`}>{article.title}</Link>
                <div className="list-item-meta">
                  <span>{article.author}</span>
                  <span className="list-item-value">👁️ {article.views}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="analytics-card">
          <h3>{t('analytics.topArticlesByEngagement')}</h3>
          <ul className="analytics-list">
            {stats.topArticlesByTimeSpent.map(article => (
              <li key={article.articleId} className="analytics-list-item">
                <Link to={`/articles/${article.articleId}`}>{article.title}</Link>
                <div className="list-item-meta">
                  <span>{article.author}</span>
                  <span className="list-item-value">⏱️ {article.timeSpent} {t('detail.metrics.seconds')}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="analytics-card">
          <h3>{t('analytics.topArticlesByRating')}</h3>
          <ul className="analytics-list">
            {stats.topArticlesByRating.map(article => (
              <li key={article.articleId} className="analytics-list-item">
                <Link to={`/articles/${article.articleId}`}>{article.title}</Link>
                <div className="list-item-meta">
                  <span>{article.author}</span>
                  <span className="list-item-value">⭐ {article.rating.toFixed(1)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="analytics-card">
          <h3>{t('analytics.topAuthors')}</h3>
          <ul className="analytics-list">
            {stats.topAuthors.map(author => (
              <li key={author.author} className="analytics-list-item">
                <span className="author-name">{author.author}</span>
                <span className="list-item-value">{author.articleCount} {t('admin.articles')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};