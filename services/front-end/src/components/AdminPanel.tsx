import { useQuery } from '@tanstack/react-query';
import { getArticles, getEngagementStats, triggerIngest } from '../api/articles';
import { getUsers, getSystemStats, setUserAsAdmin } from '../api/admin';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthCt';

export const AdminPanel = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminSetStatus, setAdminSetStatus] = useState<string | null>(null);
  
  // Validate that we have a token before making protected requests
  const accessToken = tokens.accessToken;
  if (!accessToken) {
    return <div className="error">{t('auth.adminAccessRequired')}</div>;
  }
  
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
    queryFn: () => getEngagementStats(accessToken),
    staleTime: 30 * 1000,
  });
  
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', refreshKey],
    queryFn: () => getUsers(accessToken),
    staleTime: 30 * 1000,
  });
  
  const { data: systemStats, isLoading: systemStatsLoading } = useQuery({
    queryKey: ['systemStats', refreshKey],
    queryFn: () => getSystemStats(accessToken),
    staleTime: 30 * 1000,
  });

  const handleTriggerIngest = async () => {
    try {
      setIngestStatus('Loading...');
      const result = await triggerIngest(accessToken);
      setIngestStatus(`Success! Imported ${result.articleIds.length} articles.`);
      setRefreshKey(k => k + 1);
    } catch (error) {
      setIngestStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRefreshData = () => {
    setRefreshKey(k => k + 1);
  };
  
  const handleSetAdmin = async () => {
    if (!adminUsername) {
      setAdminSetStatus('Please enter a username');
      return;
    }
    
    try {
      setAdminSetStatus('Processing...');
      const result = await setUserAsAdmin(adminUsername, accessToken);
      setAdminSetStatus(`Success: ${result.message}`);
      setAdminUsername('');
      setRefreshKey(k => k + 1);
    } catch (error) {
      setAdminSetStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading || statsLoading || usersLoading || systemStatsLoading) {
    return <div className="loading">{t('admin.loading')}</div>;
  }
  
  if (error) {
    return <div className="error">Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }

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
          <button onClick={handleTriggerIngest} className="primary-button">
            {t('admin.triggerRssImport')}
          </button>
          <button onClick={handleRefreshData} className="secondary-button">
            {t('admin.refreshData')}
          </button>
        </div>
        {ingestStatus && <div className="status-message">{ingestStatus}</div>}
      </div>
      
      <div className="admin-card">
        <h3>{t('admin.userManagement')}</h3>
        <div className="admin-form">
          <div className="form-control">
            <label htmlFor="adminUsername">{t('admin.setUserAsAdmin')}</label>
            <div className="input-group">
              <input
                type="text"
                id="adminUsername"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder={t('admin.enterUsername')}
              />
              <button onClick={handleSetAdmin} className="primary-button">
                {t('admin.setAsAdmin')}
              </button>
            </div>
          </div>
          {adminSetStatus && <div className="status-message">{adminSetStatus}</div>}
        </div>
        
        {usersData && (
          <div className="admin-users">
            <h4>{t('admin.usersList')}</h4>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.username')}</th>
                  <th>{t('admin.email')}</th>
                  <th>{t('admin.name')}</th>
                  <th>{t('admin.role')}</th>
                </tr>
              </thead>
              <tbody>
                {usersData.users.map((user) => (
                  <tr key={user.username}>
                    <td>{user.username}</td>
                    <td>{user.attributes?.email}</td>
                    <td>{user.attributes?.name}</td>
                    <td>{user.attributes?.['custom:role'] || 'user'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
              <th>{t('detail.metrics.timeSpent')}</th>
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