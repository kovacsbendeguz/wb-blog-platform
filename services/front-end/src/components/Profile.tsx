import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const Profile = () => {
  const { t } = useTranslation();
  const { user, changePassword, isLoading, error, logout } = useAuth();
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [passwordFormErrors, setPasswordFormErrors] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors when field changes
    if (name === 'newPassword' || name === 'confirmPassword') {
      setPasswordFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  const validatePasswordForm = () => {
    let valid = true;
    const errors = { newPassword: '', confirmPassword: '' };
    
    if (passwordData.newPassword.length < 8) {
      errors.newPassword = t('auth.passwordMinLength');
      valid = false;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('auth.passwordsDoNotMatch');
      valid = false;
    }
    
    setPasswordFormErrors(errors);
    return valid;
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      setChangePasswordSuccess(true);
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setChangePasswordSuccess(false);
      }, 3000);
    } catch (err) {
      // Error is handled by the auth context
      console.error('Change password error:', err);
    }
  };
  
  if (!user) {
    return <div className="loading">{t('common.loading')}</div>;
  }
  
  return (
    <div className="profile-container">
      <h2>{t('auth.profile')}</h2>
      
      <div className="profile-card">
        <h3>{t('auth.accountInfo')}</h3>
        <div className="profile-info">
          <div className="info-item">
            <strong>{t('auth.username')}:</strong> {user.username}
          </div>
          <div className="info-item">
            <strong>{t('auth.email')}:</strong> {user.email}
          </div>
          <div className="info-item">
            <strong>{t('auth.role')}:</strong> {user.role || 'user'}
          </div>
        </div>
      </div>
      
      <div className="profile-card">
        <h3>{t('auth.security')}</h3>
        
        {error && <div className="error">{error}</div>}
        {changePasswordSuccess && <div className="success-message">{t('auth.passwordChangeSuccess')}</div>}
        
        <form onSubmit={handleChangePassword} className="password-form">
          <div className="form-control">
            <label htmlFor="oldPassword">{t('auth.currentPassword')}</label>
            <input
              type="password"
              id="oldPassword"
              name="oldPassword"
              value={passwordData.oldPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>
          
          <div className="form-control">
            <label htmlFor="newPassword">{t('auth.newPassword')}</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
            />
            {passwordFormErrors.newPassword && <div className="field-error">{passwordFormErrors.newPassword}</div>}
          </div>
          
          <div className="form-control">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
            {passwordFormErrors.confirmPassword && <div className="field-error">{passwordFormErrors.confirmPassword}</div>}
          </div>
          
          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? t('auth.changing') : t('auth.changePassword')}
          </button>
        </form>
      </div>
      
      <div className="profile-card">
        <h3>{t('auth.accountActions')}</h3>
        <button onClick={logout} className="logout-button">
          {t('auth.logout')}
        </button>
      </div>
    </div>
  );
};