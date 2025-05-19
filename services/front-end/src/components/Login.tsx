import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthCt';
import { useTranslation } from 'react-i18next';

export const Login = () => {
  const { t } = useTranslation();
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.email || !formData.password) {
      setFormError(t('auth.requiredFields'));
      return;
    }

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('auth.loginFailed'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.signIn')}</h2>
        
        {error && <div className="error">{error}</div>}
        {formError && <div className="error">{formError}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="form-control">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="auth-links">
            <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
          </div>
          
          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};