import { useQuery } from '@tanstack/react-query';
import { getArticles } from '../api/articles';
import { useTranslation } from 'react-i18next';

export const Analytics = () => {
  const { t } = useTranslation();
  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['articles'],
    queryFn: getArticles,
  });

  if (isLoading) {
    return <div className="loading">{t('articles.loading')}</div>;
  }

  if (error) {
    return <div className="error">Error loading analytics: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }

  const totalArticles = articles?.length || 0;

  const authorCounts: Record<string, number> = {};
  articles?.forEach((article) => {
    authorCounts[article.author] = (authorCounts[article.author] || 0) + 1;
  });

  const topAuthors = Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }).reverse();

  const articlesPerDay: Record<string, number> = {};
  last7Days.forEach((day) => {
    articlesPerDay[day] = 0;
  });

  articles?.forEach((article) => {
    const day = article.publishedAt.split('T')[0];
    if (last7Days.includes(day)) {
      articlesPerDay[day] = (articlesPerDay[day] || 0) + 1;
    }
  });

  return (
    <div>
      <h2>{t('analytics.title')}</h2>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>{t('analytics.totalArticles')}</h3>
          <div className="analytics-value">{totalArticles}</div>
        </div>
        
        <div className="analytics-card">
          <h3>{t('analytics.topAuthors')}</h3>
          {topAuthors.length > 0 ? (
            <ul>
              {topAuthors.map(([author, count]) => (
                <li key={author}>
                  {author}: {count} {count !== 1 ? t('admin.articles').toLowerCase() : t('admin.articles').toLowerCase().slice(0, -1)}
                </li>
              ))}
            </ul>
          ) : (
            <p>{t('analytics.noData')}</p>
          )}
        </div>
        
        <div className="analytics-card">
          <h3>{t('analytics.recentActivity')}</h3>
          {Object.entries(articlesPerDay).map(([day, count]) => (
            <div key={day} className="activity-day">
              <span>{new Date(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <div className="activity-bar" style={{ width: `${Math.min(count * 20, 100)}%` }}></div>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};