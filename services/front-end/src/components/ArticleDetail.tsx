import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getArticle } from '../api/articles';
import { useTranslation } from 'react-i18next';

export const ArticleDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', id],
    queryFn: () => getArticle(id!),
    enabled: !!id,
  });

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
    <div>
      <article>
        <h2>{article.title}</h2>
        <p>
          <strong>{t('articles.by')} {article.author}</strong> | {formatDate(article.publishedAt)}
        </p>
        <div className="article-content">
          {content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        {article.metrics && (
          <div className="article-metrics">
            <h4>{t('detail.metrics.title')}</h4>
            <ul>
              <li>{t('detail.metrics.views')}: {article.metrics.views}</li>
              <li>{t('detail.metrics.timeSpent')}: {article.metrics.timeSpent} {t('detail.metrics.seconds')}</li>
              <li>{t('detail.metrics.rating')}: {article.metrics.rating}/5</li>
            </ul>
          </div>
        )}
      </article>
    </div>
  );
};