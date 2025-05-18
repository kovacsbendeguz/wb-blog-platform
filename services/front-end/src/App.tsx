import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ArticleList } from './components/ArticleList';
import { ArticleDetail } from './components/ArticleDetail';
import { CreateArticle } from './components/CreateArticle';
import { Analytics } from './components/Analytics';
import { AdminPanel } from './components/AdminPanel';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { ConfirmSignUp } from './components/ConfirmSignUp';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { Profile } from './components/Profile';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { Unauthorized } from './components/Unauthorized';
import { DebugAuth } from './components/DebugAuth';

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
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/confirm-signup" element={<ConfirmSignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes */}
            <Route path="/create" element={
              <ProtectedRoute>
                <CreateArticle />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminPanel />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        {process.env.NODE_ENV !== 'production' && <DebugAuth />}
      </div>
    </AuthProvider>
  );
}