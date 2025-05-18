import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const ResetPassword = () => {
  const { t } = useTranslation();
  const { resetPassword, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    username: (location.state as { username: string })?.username || '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [formErrors, setFormErrors] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors when field changes
    if (name === 'newPassword' || name === 'confirmPassword') {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    let valid = true;
    const errors = { newPassword: '', confirmPassword: '' };
    
    if (formData.newPassword.length < 8) {
      errors.newPassword = t('auth.passwordMinLength');
      valid = false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
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
      await resetPassword(formData.username, formData.code, formData.newPassword);
      navigate('/signin', { 
        state: { 
          message: t('auth.passwordResetSuccess'),
          username: formData.username 
        } 
      });
    } catch (err) {
      // Error is handled by the auth context
      console.error('Reset password error:', err);
    }
  };
  
  return (
    <div className="auth-form-container">
      <h2>{t('auth.resetPassword')}</h2>
      
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
          <label htmlFor="code">{t('auth.resetCode')}</label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            placeholder="123456"
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
          />
          {formErrors.newPassword && <div className="field-error">{formErrors.newPassword}</div>}
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
          {isLoading ? t('auth.resetting') : t('auth.resetPassword')}
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