import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const ForgotPassword = () => {
  const { t } = useTranslation();
  const { forgotPassword, isLoading, error } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword(username);
      setSubmitted(true);
      navigate('/reset-password', { state: { username } });
    } catch (err) {
      // Error is handled by the auth context
      console.error('Forgot password error:', err);
    }
  };
  
  return (
    <div className="auth-form-container">
      <h2>{t('auth.forgotPassword')}</h2>
      
      {!submitted ? (
        <>
          <p>{t('auth.forgotPasswordInstruction')}</p>
          
          {error && <div className="error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-control">
              <label htmlFor="username">{t('auth.username')}</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" disabled={isLoading} className="auth-button">
              {isLoading ? t('auth.sending') : t('auth.sendResetCode')}
            </button>
            
            <div className="auth-footer">
              <p>
                <Link to="/signin" className="auth-link">
                  {t('auth.backToSignIn')}
                </Link>
              </p>
            </div>
          </form>
        </>
      ) : (
        <div className="auth-message">
          <p>{t('auth.resetCodeSent')}</p>
          <Link to="/reset-password" className="auth-button">
            {t('auth.resetPassword')}
          </Link>
        </div>
      )}
    </div>
  );
};