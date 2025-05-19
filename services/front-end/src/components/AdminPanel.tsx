import { useQuery } from '@tanstack/react-query';
import { getArticles, getEngagementStats, triggerIngest } from '../api/articles';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const AdminPanel = () => {
  const { t } = useTranslation();
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['articlesAdmin', refreshKey],
    queryFn: async () => {
      const response = await getArticles(100);
      return response;
    },
    staleTime: 30 * 1000,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['engagementStats', refreshKey],
    queryFn: getEngagementStats,
    staleTime: 30 * 1000,
  });

  const handleTriggerIngest = async () => {
    try {
      setIngestStatus('Loading...');
      const result = await triggerIngest();
      setIngestStatus(`Success! Imported ${result.articleIds.length} articles.`);
      setRefreshKey(k => k + 1);
    } catch (error) {
      setIngestStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRefreshData = () => {
    setIngestStatus('Refreshing data...');
    setRefreshKey(k => k + 1);
    
    setTimeout(() => {
      setIngestStatus('Data refreshed successfully');
      
      setTimeout(() => {
        setIngestStatus(null);
      }, 3000);
    }, 500);
  };

  if (isLoading || statsLoading) return <div className="loading">{t('admin.loading')}</div>;
  if (error) return <div className="error">Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</div>;

  const articles = data?.articles || [];
  
  const totalArticles = articles.length || 0;
  const totalAuthors = new Set(articles.map(a => a.author)).size;
  const averageContentLength = articles.reduce((acc, article) => 
    acc + (typeof article.content === 'string' ? article.content.length : 0), 0) / (totalArticles || 1);
  
  const authorCounts = articles.reduce((acc, article) => {
    const author = article.author;
    acc[author] = (acc[author] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topAuthors = Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sortedArticlesByViews = [...articles]
    .sort((a, b) => {
      const aViews = a.metrics?.views || 0;
      const bViews = b.metrics?.views || 0;
      return bViews - aViews;
    })
    .slice(0, 10);

  return (
    <div className="admin-panel">
      <h2>{t('admin.title')}</h2>
      
      <div className="admin-cards">
        <div className="admin-card">
          <h3>{t('admin.contentStatistics')}</h3>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-value">{totalArticles}</div>
              <div className="stat-label">{t('admin.totalArticles')}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{totalAuthors}</div>
              <div className="stat-label">{t('admin.uniqueAuthors')}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{averageContentLength.toFixed(0)}</div>
              <div className="stat-label">{t('admin.avgContentLength')}</div>
            </div>
          </div>
        </div>
        
        <div className="admin-card">
          <h3>{t('admin.topAuthors')}</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.author')}</th>
                <th>{t('admin.articles')}</th>
              </tr>
            </thead>
            <tbody>
              {topAuthors.map(([author, count]) => (
                <tr key={author}>
                  <td>{author}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="admin-card">
        <h3>{t('admin.contentManagement')}</h3>
        <div className="admin-actions">
          <button onClick={handleTriggerIngest} className="primary-button" title="Import articles from RSS feeds">
            {t('admin.triggerRssImport')}
          </button>
          <button onClick={handleRefreshData} className="secondary-button" title="Reload data from the database">
            {t('admin.refreshData')}
          </button>
        </div>
        {ingestStatus && <div className="status-message">{ingestStatus}</div>}
      </div>
      
      {statsData && (
        <div className="admin-card engagement-stats">
          <h3>{t('admin.engagementOverview')}</h3>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-value">{statsData.averageMetrics.views.toFixed(1)}</div>
              <div className="stat-label">{t('analytics.averageViews')}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{statsData.averageMetrics.timeSpent.toFixed(0)}</div>
              <div className="stat-label">{t('analytics.averageTimeSpent')} ({t('detail.metrics.seconds')})</div>
            </div>
            <div className="stat">
              <div className="stat-value">{statsData.averageMetrics.rating.toFixed(1)}</div>
              <div className="stat-label">{t('analytics.averageRating')}</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="admin-card">
        <h3>{t('admin.mostViewedArticles')}</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.article')}</th>
              <th>{t('admin.author')}</th>
              <th>{t('detail.metrics.views')}</th>
              <th>{t('admin.totalTimeSpent')}</th>
              <th>{t('detail.metrics.rating')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedArticlesByViews.map(article => (
              <tr key={article.articleId}>
                <td>
                  <a href={`/articles/${article.articleId}`} target="_blank" rel="noopener noreferrer">
                    {article.title}
                  </a>
                </td>
                <td>{article.author}</td>
                <td>{article.metrics?.views || 0}</td>
                <td>{article.metrics?.timeSpent || 0}s</td>
                <td>{article.metrics?.rating ? article.metrics.rating.toFixed(1) : '0.0'}</td>
              </tr>
            ))}
            {sortedArticlesByViews.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-table-message">No article metrics available yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};