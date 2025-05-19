import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { useTranslation } from 'react-i18next';

export const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError(t('auth.emailRequired'));
      return;
    }

    setIsLoading(true);
    
    try {
      await forgotPassword({ email });
      setSuccess(true);
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.forgotPasswordFailed'));
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>{t('auth.checkYourEmail')}</h2>
          <p>{t('auth.resetCodeSent')}</p>
          <Link to="/reset-password" className="auth-button">{t('auth.resetPassword')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.forgotPassword')}</h2>
        <p>{t('auth.forgotPasswordInstructions')}</p>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? t('auth.sending') : t('auth.sendResetCode')}
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