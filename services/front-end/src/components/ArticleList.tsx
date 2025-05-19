import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getArticles } from '../api/articles';
import { Article } from '../types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from './EmptyState';

export const ArticleList = () => {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationHistory, setPaginationHistory] = useState<{ page: number, nextToken: string | null }[]>([
    { page: 1, nextToken: null }
  ]);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', paginationHistory[currentPage - 1]?.nextToken],
    queryFn: () => getArticles(10, paginationHistory[currentPage - 1]?.nextToken ?? undefined),
  });

  useEffect(() => {
    if (data && currentPage === paginationHistory.length) {
      setPaginationHistory(prev => [
        ...prev.slice(0, currentPage),
        { page: currentPage + 1, nextToken: data.nextToken }
      ]);
    }
  }, [data, currentPage]);

  const loadNextPage = () => {
    if (data?.nextToken) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const loadPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (isLoading) {
    return <div className="loading">{t('articles.loading')}</div>;
  }

  if (error) {
    return <div className="error">Error loading articles: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }

  if (!data?.articles || data.articles.length === 0) {
    return <EmptyState />;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getContentSnippet = (article: Article): string => {
    let content: string;
    
    if (typeof article.content === 'string' && article.content.trim() !== 'Comments') {
      content = article.content;
    } else if (typeof article.content === 'object' && article.content !== null) {
      content = JSON.stringify(article.content);
    } else {
      return `This article discusses ${article.title}. Click to read more about this topic.`;
    }
    
    content = content
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')   // Replace &nbsp; with spaces
      .replace(/\s\s+/g, ' ')    // Normalize whitespace
      .trim();
    
    if (content.trim() === 'Comments') {
      return `Read this article about ${article.title} by ${article.author}.`;
    }
    
    const maxLength = 150;
    if (content.length <= maxLength) return content;
    
    const lastSpace = content.lastIndexOf(' ', maxLength);
    const breakPoint = lastSpace > maxLength / 2 ? lastSpace : maxLength;
    
    return `${content.substring(0, breakPoint)}...`;
  };

  return (
    <div className="articles-section">
      <h2>{t('articles.title')}</h2>
      <div className="articles-grid">
        {data.articles.map((article: Article) => (
          <Link 
            to={`/articles/${article.articleId}`} 
            className="article-card-link"
            key={article.articleId}
          >
            <div className="article-card">
              <h3 className="article-title">{article.title}</h3>
              <p className="article-meta">
                <strong>{t('articles.by')} {article.author}</strong> | <span className="article-date">{formatDate(article.publishedAt)}</span>
              </p>
              
              <p className="article-excerpt">
                {getContentSnippet(article)}
              </p>
              
              <div className="article-footer">
                <div className="article-preview-metrics">
                  <span title={t('detail.metrics.views')}>👁️ {article.metrics?.views || 0}</span>
                  <span title={t('detail.metrics.rating')}>⭐ {article.metrics?.rating ? article.metrics.rating.toFixed(1) : '0.0'}</span>
                </div>
                <span className="read-more">{t('articles.readMore')} →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="pagination-controls">
        <button 
          onClick={loadPreviousPage} 
          disabled={currentPage <= 1}
          className="pagination-button"
        >
          {t('articles.previousPage')}
        </button>
        <span className="page-indicator">Page {currentPage}</span>
        <button 
          onClick={loadNextPage} 
          disabled={!data.nextToken}
          className="pagination-button"
        >
          {t('articles.nextPage')}
        </button>
      </div>
    </div>
  );
};