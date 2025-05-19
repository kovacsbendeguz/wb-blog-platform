import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ArticleList } from './components/ArticleList';
import { ArticleDetail } from './components/ArticleDetail';
import { CreateArticle } from './components/CreateArticle';
import { Analytics } from './components/Analytics';
import { AdminPanel } from './components/AdminPanel';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ConfirmSignUp } from './components/ConfirmSignUp';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { Profile } from './components/Profile';
import { ChangePassword } from './components/ChangePassword';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Unauthorized } from './components/Unauthorized';
import { AuthProvider } from './context/AuthCt';

export function App() {
  return (
    <AuthProvider>
      <div className="container">
        <Navbar />
        <main>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<ArticleList />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/confirm" element={<ConfirmSignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes - require authentication */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes - require author role */}
            <Route 
              path="/create" 
              element={
                <ProtectedRoute requiredRole="author">
                  <CreateArticle />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes - require admin role */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}