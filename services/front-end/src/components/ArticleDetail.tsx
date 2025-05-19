import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getArticle, updateArticleMetrics } from '../api/articles';
import { useTranslation } from 'react-i18next';
import { Article } from '../types';

export const ArticleDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
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

  const viewMetricsMutation = useMutation({
    mutationFn: (metrics: { incrementView?: boolean; timeSpent?: number }) => 
      updateArticleMetrics(id!, metrics),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', id] });
    },
  });

  const ratingMutation = useMutation({
    mutationFn: (rating: number) => {
      console.log(`Submitting rating ${rating} for article ${id}`);
      return updateArticleMetrics(id!, { rating });
    },
    onSuccess: () => {
      console.log("Rating submitted successfully");
      setShowRatingSuccess(true);
      setTimeout(() => setShowRatingSuccess(false), 3000);
      
      queryClient.invalidateQueries({ queryKey: ['article', id] });
    },
    onError: (error) => {
      console.error("Error submitting rating:", error);
    }
  });

  useEffect(() => {
    if (id && !viewTrackedRef.current) {
      viewMetricsMutation.mutate({ incrementView: true });
      viewTrackedRef.current = true;
      startTimeRef.current = Date.now();
    }
    
    return () => {
      if (id && viewTrackedRef.current) {
        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (timeSpent > 5) {
          try {
            viewMetricsMutation.mutate({ timeSpent });
          } catch (e) {
            console.error("Error updating time spent:", e);
          }
        }
      }
    };
  }, [id]);

  const handleRating = (rating: number) => {
    if (id) {
      setUserRating(rating);
      ratingMutation.mutate(rating);
    }
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

  const getArticleContent = (article: Article): string => {
    if (!article.content || article.content === "Comments" || article.content === "Comments.") {
      return `This article discusses the topic of ${article.title}. For more information, you can visit the original source by clicking the link above.`;
    }
    
    let content = typeof article.content === 'string' 
      ? article.content 
      : JSON.stringify(article.content) || 'No content available';
    
    content = content
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')   // Replace &nbsp; with spaces
      .replace(/\s\s+/g, ' ')    // Normalize whitespace
      .trim();
    
    if (content === "Comments" || content === "Comments.") {
      return `This article discusses the topic of ${article.title}. For more information, you can visit the original source by clicking the link above.`;
    }
    
    return content;
  };

  const formatContent = (content: string): string[] => {
    const paragraphs = content.split(/\n+/);
    if (paragraphs.length > 1) {
      return paragraphs;
    }
    
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    const result: string[] = [];
    
    for (let i = 0; i < sentences.length; i += 3) {
      result.push(sentences.slice(i, i + 3).join(' '));
    }
    
    return result.length > 0 ? result : [content];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const content = getArticleContent(article);
  const paragraphs = formatContent(content);

  return (
    <div className="article-detail">
      <div className="article-navigation">
        <Link to="/" className="back-link">
          ← {t('navigation.home')}
        </Link>
      </div>
      
      <article className="article-container">
        <h1 className="article-detail-title">{article.title}</h1>
        <div className="article-meta">
          <p>
            <strong>{t('articles.by')} {article.author}</strong> | {formatDate(article.publishedAt)}
          </p>
          {article.sourceUrl && (
            <p className="source-link">
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                {t('detail.viewSource')} ↗
              </a>
            </p>
          )}
        </div>
        
        <div className="article-content">
          {paragraphs.map((paragraph: string, index: number) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        
        <div className="article-metrics-container">
          <h3 className="metrics-title">{t('detail.metrics.title')}</h3>
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
            <h4 className="rating-title">{t('detail.rateArticle')}</h4>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className={`star-button ${userRating && star <= userRating ? 'active' : ''}`}
                  disabled={ratingMutation.isPending}
                  aria-label={`Rate ${star} stars`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {ratingMutation.isPending && <div className="rating-loading">Submitting rating...</div>}
            {ratingMutation.isError && (
              <div className="rating-error">
                Error saving rating: {ratingMutation.error instanceof Error ? 
                  ratingMutation.error.message : 'Unknown error'}
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