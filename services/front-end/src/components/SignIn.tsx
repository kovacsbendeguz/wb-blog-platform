import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const SignIn = () => {
  const { t } = useTranslation();
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.username, formData.password);
      navigate('/');
    } catch (err) {
      // Error is handled by the auth context
      console.error('Login error:', err);
    }
  };
  
  return (
    <div className="auth-form-container">
      <h2>{t('auth.signIn')}</h2>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-control">
          <label htmlFor="username">{t('auth.username')}</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
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
            required
          />
        </div>
        
        <div className="auth-links">
          <Link to="/forgot-password" className="auth-link">
            {t('auth.forgotPassword')}
          </Link>
        </div>
        
        <button type="submit" disabled={isLoading} className="auth-button">
          {isLoading ? t('auth.signingIn') : t('auth.signIn')}
        </button>
        
        <div className="auth-footer">
          <p>
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="auth-link">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};