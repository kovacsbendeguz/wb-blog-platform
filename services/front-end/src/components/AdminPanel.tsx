import { useQuery } from '@tanstack/react-query';
import { getArticles, triggerIngest } from '../api/articles';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const AdminPanel = () => {
  const { t } = useTranslation();
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const { data: articles, isLoading, error, refetch } = useQuery({
    queryKey: ['articles'],
    queryFn: getArticles,
  });

  const handleTriggerIngest = async () => {
    try {
      setIngestStatus('Loading...');
      const result = await triggerIngest();
      setIngestStatus(`Success! Imported ${result.articleIds.length} articles.`);
      refetch();
    } catch (error) {
      setIngestStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading) return <div className="loading">{t('admin.loading')}</div>;
  if (error) return <div className="error">Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</div>;

  const totalArticles = articles?.length || 0;
  const totalAuthors = new Set(articles?.map(a => a.author)).size;
  const averageContentLength = (articles ?? []).reduce((acc, article) => 
    acc + (typeof article.content === 'string' ? article.content.length : 0), 0) / (totalArticles || 1);
  
  const authorCounts = articles?.reduce((acc, article) => {
    const author = article.author;
    acc[author] = (acc[author] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topAuthors = Object.entries(authorCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
          <button onClick={handleTriggerIngest} className="primary-button">
            {t('admin.triggerRssImport')}
          </button>
          <button onClick={() => refetch()} className="secondary-button">
            {t('admin.refreshData')}
          </button>
        </div>
        {ingestStatus && <div className="status-message">{ingestStatus}</div>}
      </div>
    </div>
  );
};