// services/front-end/src/components/CreateArticle.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createArticle } from '../api/articles';
import { CreateArticlePayload } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const CreateArticle = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateArticlePayload>({
    title: '',
    content: '',
    author: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Set author to user's name when component mounts
  useState(() => {
    if (user?.username) {
      setFormData(prev => ({ ...prev, author: user.username }));
    }
  });

  const mutation = useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate('/');
    },
    onError: (error) => {
      console.error('Error creating article:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to create article');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!isAuthenticated) {
      setFormError('You must be logged in to create an article');
      return;
    }
    
    mutation.mutate(formData);
  };

  return (
    <div>
      <h2>{t('create.title')}</h2>
      
      {formError && (
        <div className="error">
          {formError}
        </div>
      )}
      
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