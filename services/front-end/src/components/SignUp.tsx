import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const SignUp = () => {
  const { t } = useTranslation();
  const { signup, isLoading, error } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  
  const [formErrors, setFormErrors] = useState({
    password: '',
    confirmPassword: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors when field changes
    if (name === 'password' || name === 'confirmPassword') {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    let valid = true;
    const errors = { password: '', confirmPassword: '' };
    
    if (formData.password.length < 8) {
      errors.password = t('auth.passwordMinLength');
      valid = false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('auth.passwordsDoNotMatch');
      valid = false;
    }
    
    setFormErrors(errors);
    return valid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await signup(formData.username, formData.email, formData.password, formData.name);
      navigate('/confirm-signup', { state: { username: formData.username } });
    } catch (err) {
      // Error is handled by the auth context
      console.error('Signup error:', err);
    }
  };
  
  return (
    <div className="auth-form-container">
      <h2>{t('auth.signUp')}</h2>
      
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
          <label htmlFor="email">{t('auth.email')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-control">
          <label htmlFor="name">{t('auth.name')} ({t('auth.optional')})</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
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
          {formErrors.password && <div className="field-error">{formErrors.password}</div>}
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
          {formErrors.confirmPassword && <div className="field-error">{formErrors.confirmPassword}</div>}
        </div>
        
        <button type="submit" disabled={isLoading} className="auth-button">
          {isLoading ? t('auth.signingUp') : t('auth.signUp')}
        </button>
        
        <div className="auth-footer">
          <p>
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/signin" className="auth-link">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};