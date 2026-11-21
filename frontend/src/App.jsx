import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import EnhancementPage from './pages/EnhancementPage';
import MorphologyPage from './pages/MorphologyPage';
import WatershedPage from './pages/WatershedPage';
import ClassificationPage from './pages/ClassificationPage';
import NotFound from './pages/NotFound';

// Automatically scroll window to top on page route changes unless hash is present
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/modules/enhancement" element={<EnhancementPage />} />
              <Route path="/modules/morphology" element={<MorphologyPage />} />
              <Route path="/modules/watershed" element={<WatershedPage />} />
              <Route path="/modules/classification" element={<ClassificationPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
