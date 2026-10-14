import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import './styles/global.css';

import { HoverLabel, Toast, Flash } from './components/Overlays';
import Navbar       from './sections/Navbar';
import Footer       from './sections/Footer';
import HomePage     from './pages/HomePage';
import TalentPage   from './pages/TalentPage';
import NotFoundPage from './pages/NotFoundPage';
import { useSceneScroll } from './hooks/useSceneScroll';
import { scrollToScene } from './lib/nav';

// three.js is heavy → load it after the page text has painted
const WorldCanvas = lazy(() => import('./components/WorldCanvas'));

export default function App() {
  const { pathname, hash } = useLocation();
  useSceneScroll();

  // new page → start at the top (unless a #deep-link will scroll for us)
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);

  // in-page #anchors fly the camera to the matching scene
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      const id = a.getAttribute('href')!.slice(1);
      if (!document.getElementById(id)) return;
      e.preventDefault();
      scrollToScene(id);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <>
      <Suspense fallback={null}><WorldCanvas /></Suspense>
      <HoverLabel />
      <Navbar />
      <main>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/talent/:slug" element={<TalentPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <Toast />
      <Flash />
    </>
  );
}
