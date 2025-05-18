import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const ConfirmSignUp = () => {
  const { t } = useTranslation();
  const { confirmSignup, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [username, setUsername] = useState(
    (location.state as { username: string })?.username || ''
  );
  const [code, setCode] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await confirmSignup(username, code);
      navigate('/signin', { 
        state: { 
          message: t('auth.accountConfirmed'),
          username 
        } 
      });
    } catch (err) {
      // Error is handled by the auth context
      console.error('Confirmation error:', err);
    }
  };
  
  return (
    <div className="auth-form-container">
      <h2>{t('auth.confirmAccount')}</h2>
      <p>{t('auth.confirmCodeSent')}</p>
      
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
        
        <div className="form-control">
          <label htmlFor="code">{t('auth.confirmationCode')}</label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="123456"
          />
        </div>
        
        <button type="submit" disabled={isLoading} className="auth-button">
          {isLoading ? t('auth.confirming') : t('auth.confirmAccount')}
        </button>
        
        <div className="auth-footer">
          <p>
            <Link to="/signin" className="auth-link">
              {t('auth.backToSignIn')}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};