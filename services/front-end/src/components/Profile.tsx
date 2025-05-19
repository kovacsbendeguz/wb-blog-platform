import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthCt';
import { updateUserProfile, getUserProfile, getAuthorArticles } from '../api/profile';
import { Link } from 'react-router-dom';

export const Profile = () => {
  const { t } = useTranslation();
  const { user, tokens, updateUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: user?.attributes?.name || '',
    bio: user?.attributes?.bio || '',
  });
  
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Make sure we have a token
  if (!tokens.accessToken) {
    return (
      <div className="auth-required">
        <h2>{t('profile.authRequired')}</h2>
        <p>{t('profile.loginToView')}</p>
        <Link to="/login" className="auth-button">{t('auth.login')}</Link>
      </div>
    );
  }

  // Get user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getUserProfile(tokens.accessToken || ''),
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.attributes?.name || '',
        bio: profile.attributes?.bio || '',
      });
    }
  }, [profile]);
  
  // Get user's articles
  const { data: authorArticles, isLoading: articlesLoading } = useQuery({
    queryKey: ['authorArticles', user?.username],
    queryFn: () => getAuthorArticles(user?.username || '', tokens.accessToken || ''),
    enabled: !!user?.username && !!tokens.accessToken
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; bio: string }) => 
      updateUserProfile(data, tokens.accessToken || ''),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      updateUser(data);
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
    },
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };
  
  if (profileLoading || articlesLoading) {
    return <div className="loading">{t('profile.loading')}</div>;
  }

  return (
    <div className="profile-container">
      <h2>{t('profile.title')}</h2>
      
      <div className="profile-grid">
        <div className="profile-card">
          <h3>{t('profile.userInfo')}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-control">
              <label htmlFor="name">{t('profile.name')}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-control">
              <label htmlFor="bio">{t('profile.bio')}</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button" 
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending 
                ? t('profile.updating') 
                : t('profile.updateProfile')}
            </button>
            
            {updateProfileMutation.isError && (
              <div className="error-message">
                {updateProfileMutation.error instanceof Error 
                  ? updateProfileMutation.error.message 
                  : t('profile.updateError')}
              </div>
            )}
            
            {formSuccess && (
              <div className="success-message">
                {t('profile.updateSuccess')}
              </div>
            )}
          </form>
        </div>
        
        <div className="profile-card">
          <h3>{t('profile.account')}</h3>
          <div className="account-info">
            <div className="info-group">
              <label>{t('profile.username')}</label>
              <p>{user?.username}</p>
            </div>
            
            <div className="info-group">
              <label>{t('profile.email')}</label>
              <p>{user?.attributes?.email}</p>
            </div>
            
            <div className="info-group">
              <label>{t('profile.role')}</label>
              <p>{user?.attributes?.['custom:role'] || 'user'}</p>
            </div>
            
            <div className="info-group">
              <label>{t('profile.groups')}</label>
              <p>
                {user?.attributes?.['cognito:groups'] 
                  ? user.attributes['cognito:groups'].split(',').join(', ') 
                  : t('profile.noGroups')}
              </p>
            </div>
          </div>
          
          <div className="account-actions">
            <Link to="/change-password" className="secondary-button">
              {t('profile.changePassword')}
            </Link>
          </div>
        </div>
      </div>
      
      <div className="profile-articles">
        <h3>{t('profile.yourArticles')}</h3>
        
        {!authorArticles?.articles?.length ? (
          <p className="no-articles">{t('profile.noArticles')}</p>
        ) : (
          <div className="articles-grid">
            {authorArticles.articles.map((article) => (
              <div key={article.articleId} className="article-card">
                <h4>{article.title}</h4>
                <p className="article-date">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </p>
                <div className="article-metrics">
                  <span>👁️ {article.metrics?.views || 0}</span>
                  <span>⭐ {article.metrics?.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="article-actions">
                  <Link to={`/articles/${article.articleId}`} className="view-button">
                    {t('profile.view')}
                  </Link>
                  <Link to={`/edit/${article.articleId}`} className="edit-button">
                    {t('profile.edit')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="create-new">
          <Link to="/create" className="auth-button">
            {t('profile.createNew')}
          </Link>
        </div>
      </div>
    </div>
  );
};