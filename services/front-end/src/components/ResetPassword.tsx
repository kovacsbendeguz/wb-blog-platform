import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { useTranslation } from 'react-i18next';

export const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email') || '';
  
  const [formData, setFormData] = useState({
    email,
    confirmationCode: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.confirmationCode || !formData.newPassword) {
      setError(t('auth.allFieldsRequired'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (formData.newPassword.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword({
        email: formData.email,
        confirmationCode: formData.confirmationCode,
        newPassword: formData.newPassword,
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetPasswordFailed'));
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>{t('auth.passwordReset')}</h2>
          <p>{t('auth.passwordResetSuccess')}</p>
          <Link to="/login" className="auth-button">{t('auth.goToLogin')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.resetPassword')}</h2>
        <p>{t('auth.resetPasswordInstructions')}</p>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <label htmlFor="confirmationCode">{t('auth.confirmationCode')}</label>
            <input
              type="text"
              id="confirmationCode"
              name="confirmationCode"
              value={formData.confirmationCode}
              onChange={handleChange}
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
              required
            />
          </div>
          
          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? t('auth.resetting') : t('auth.resetPassword')}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            <Link to="/login">{t('auth.backToLogin')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};