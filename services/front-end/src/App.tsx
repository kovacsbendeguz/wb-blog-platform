import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ArticleList } from './components/ArticleList';
import { ArticleDetail } from './components/ArticleDetail';
import { CreateArticle } from './components/CreateArticle';
import { Analytics } from './components/Analytics';
import { AdminPanel } from './components/AdminPanel';

export function App() {
  return (
    <div className="container">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<ArticleList />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/create" element={<CreateArticle />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>
    </div>
  );
}