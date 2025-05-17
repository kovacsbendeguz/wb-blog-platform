import { useQuery } from '@tanstack/react-query';
import { getArticles } from '../api/articles';
import { Article } from '../types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const ArticleList = () => {
  const { t, i18n } = useTranslation();
  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['articles'],
    queryFn: getArticles,
  });

  if (isLoading) {
    return <div className="loading">{t('articles.loading')}</div>;
  }

  if (error) {
    return <div className="error">Error loading articles: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }

  if (!articles || articles.length === 0) {
    return <div>{t('articles.empty')}</div>;
  }

  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

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
      <h2>{t('articles.title')}</h2>
      {sortedArticles.map((article: Article) => (
        <div key={article.articleId} className="article-card">
          <h3>{article.title}</h3>
          <p>
            <strong>{t('articles.by')} {article.author}</strong> | {formatDate(article.publishedAt)}
          </p>
          <p>
            {typeof article.content === 'string' 
              ? article.content.length > 150 
                ? `${article.content.substring(0, 150)}...` 
                : article.content
              : 'No content available'}
          </p>
          <Link to={`/articles/${article.articleId}`}>{t('articles.readMore')}</Link>
        </div>
      ))}
    </div>
  );
};