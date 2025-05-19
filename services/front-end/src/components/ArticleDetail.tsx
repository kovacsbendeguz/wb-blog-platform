import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getArticle, updateArticleMetrics } from '../api/articles';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthCt';

export const ArticleDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { tokens, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const startTimeRef = useRef<number>(Date.now());
  const viewTrackedRef = useRef<boolean>(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);
  
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', id],
    queryFn: () => getArticle(id!),
    enabled: !!id,
  });

  const updateMetricsMutation = useMutation({
    mutationFn: (metrics: { incrementView?: boolean; timeSpent?: number; rating?: number }) => 
      updateArticleMetrics(id!, metrics, tokens.accessToken || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', id] });
    },
  });

  useEffect(() => {
    if (id && !viewTrackedRef.current) {
      updateMetricsMutation.mutate({ incrementView: true });
      viewTrackedRef.current = true;
      startTimeRef.current = Date.now();
    }
    
    return () => {
      if (id && viewTrackedRef.current) {
        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (timeSpent > 5) {
          try {
            updateMetricsMutation.mutate({ timeSpent });
          } catch (e) {
            console.error("Error updating time spent:", e);
          }
        }
      }
    };
  }, [id]);

  const handleRating = (rating: number) => {
    if (!id) return;
    
    // Only allow authenticated users to rate articles
    if (!isAuthenticated) {
      alert(t('auth.loginToRate'));
      return;
    }
    
    setUserRating(rating);
    updateMetricsMutation.mutate(
      { rating },
      {
        onSuccess: () => {
          setShowRatingSuccess(true);
          setTimeout(() => setShowRatingSuccess(false), 3000);
        },
        onError: (error) => {
          console.error("Error submitting rating:", error);
          alert("Sorry, there was an error submitting your rating. Please try again later.");
        }
      }
    );
  };

  if (isLoading) {
    return <div className="loading">{t('detail.loading')}</div>;
  }

  if (error) {
    return <div className="error">Error loading article: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }

  if (!article) {
    return <div className="error">{t('detail.notFound')}</div>;
  }

  const content = typeof article.content === 'string' 
    ? article.content 
    : JSON.stringify(article.content) || 'No content available';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="article-detail">
      <article>
        <h2>{article.title}</h2>
        <div className="article-meta">
          <p>
            <strong>{t('articles.by')} {article.author}</strong> | {formatDate(article.publishedAt)}
          </p>
          {article.sourceUrl && (
            <p className="source-link">
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                {t('detail.viewSource')}
              </a>
            </p>
          )}
        </div>
        
        <div className="article-content">
          {content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        
        <div className="article-metrics">
          <h4>{t('detail.metrics.title')}</h4>
          <div className="metrics-data">
            <div className="metric-item">
              <span className="metric-icon">👁️</span>
              <span className="metric-value">{article.metrics?.views || 0}</span>
              <span className="metric-label">{t('detail.metrics.views')}</span>
            </div>
            <div className="metric-item">
              <span className="metric-icon">⏱️</span>
              <span className="metric-value">{article.metrics?.timeSpent || 0}</span>
              <span className="metric-label">{t('detail.metrics.seconds')}</span>
            </div>
            <div className="metric-item">
              <span className="metric-icon">⭐</span>
              <span className="metric-value">{article.metrics?.rating ? article.metrics.rating.toFixed(1) : '0.0'}</span>
              <span className="metric-label">{t('detail.metrics.rating')}</span>
            </div>
          </div>
          
          <div className="rating-container">
            <h5>{t('detail.rateArticle')}</h5>
            {!isAuthenticated && (
              <p className="rating-login-message">{t('auth.loginToRate')}</p>
            )}
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className={`star-button ${userRating && star <= userRating ? 'active' : ''}`}
                  disabled={updateMetricsMutation.isPending || !isAuthenticated}
                  aria-label={`Rate ${star} stars`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {updateMetricsMutation.isPending && <div className="rating-loading">Submitting rating...</div>}
            {updateMetricsMutation.isError && (
              <div className="rating-error">
                Error saving rating: {updateMetricsMutation.error instanceof Error ? 
                  updateMetricsMutation.error.message : 'Unknown error'}
              </div>
            )}
            {showRatingSuccess && (
              <div className="rating-success">{t('detail.ratingSuccess')}</div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
};