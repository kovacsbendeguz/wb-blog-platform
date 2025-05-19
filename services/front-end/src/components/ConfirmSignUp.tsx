import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { confirmSignUp } from '../api/auth';
import { useTranslation } from 'react-i18next';

export const ConfirmSignUp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email') || '';
  
  const [formData, setFormData] = useState({
    email,
    confirmationCode: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.confirmationCode) {
      setError(t('auth.confirmationCodeRequired'));
      return;
    }

    setIsLoading(true);
    
    try {
      await confirmSignUp({
        email: formData.email,
        confirmationCode: formData.confirmationCode,
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.confirmationFailed'));
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>{t('auth.accountConfirmed')}</h2>
          <p>{t('auth.redirectingToLogin')}</p>
          <Link to="/login" className="auth-button">{t('auth.goToLogin')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.confirmAccount')}</h2>
        <p>{t('auth.confirmationCodeSent', { email: formData.email })}</p>
        
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
          
          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? t('auth.confirming') : t('auth.confirm')}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            {t('auth.didntReceiveCode')} <Link to="/register">{t('auth.resend')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};