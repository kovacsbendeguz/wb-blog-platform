import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createArticle } from '../api/articles';
import { CreateArticlePayload } from '../types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthCt';

export const CreateArticle = () => {
  const { t } = useTranslation();
  const { tokens, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateArticlePayload>({
    title: '',
    content: '',
    author: user?.attributes?.name || user?.username || '',
  });

  const mutation = useMutation({
    mutationFn: (data: CreateArticlePayload) => {
      if (!tokens.accessToken) {
        throw new Error(t('auth.loginRequired'));
      }
      return createArticle(data, tokens.accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate('/');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div>
      <h2>{t('create.title')}</h2>
      {mutation.error && (
        <div className="error">
          {t('create.error')}: {mutation.error instanceof Error ? mutation.error.message : 'Unknown error'}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <label htmlFor="title">{t('create.form.title')}</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-control">
          <label htmlFor="author">{t('create.form.author')}</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
            readOnly={!!user} // Make author read-only if user is logged in
          />
        </div>
        <div className="form-control">
          <label htmlFor="content">{t('create.form.content')}</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t('create.form.publishing') : t('create.form.publish')}
        </button>
      </form>
    </div>
  );
};