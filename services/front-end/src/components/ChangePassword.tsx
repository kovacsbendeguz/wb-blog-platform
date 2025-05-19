import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/auth';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthCt';

export const ChangePassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tokens } = useAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [formError, setFormError] = useState<string | null>(null);
  
  const changePasswordMutation = useMutation({
    mutationFn: (data: { previousPassword: string; proposedPassword: string }) => {
      if (!tokens.accessToken) {
        throw new Error(t('auth.loginRequired'));
      }
      return changePassword(data, tokens.accessToken);
    },
    onSuccess: () => {
      navigate('/profile');
    },
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (formData.newPassword !== formData.confirmPassword) {
      setFormError(t('auth.passwordsDoNotMatch'));
      return;
    }
    
    if (formData.newPassword.length < 8) {
      setFormError(t('auth.passwordTooShort'));
      return;
    }
    
    try {
      await changePasswordMutation.mutateAsync({
        previousPassword: formData.currentPassword,
        proposedPassword: formData.newPassword,
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('auth.changePasswordFailed'));
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.changePassword')}</h2>
        
        {formError && <div className="error">{formError}</div>}
        {changePasswordMutation.isError && (
          <div className="error">
            {changePasswordMutation.error instanceof Error 
              ? changePasswordMutation.error.message 
              : t('auth.changePasswordFailed')}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <label htmlFor="currentPassword">{t('auth.currentPassword')}</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-control">
            <label htmlFor="newPassword">{t('auth.newPassword')}</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={8}
            />
            <small>{t('auth.passwordRequirements')}</small>
          </div>
          
          <div className="form-control">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={changePasswordMutation.isPending} 
            className="auth-button"
          >
            {changePasswordMutation.isPending 
              ? t('auth.changing') 
              : t('auth.changePassword')}
          </button>
        </form>
      </div>
    </div>
  );
};