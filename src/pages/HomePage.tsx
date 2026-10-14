import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection     from '../sections/HeroSection';
import TalentsSection  from '../sections/TalentsSection';
import AboutSection    from '../sections/AboutSection';
import StudioSection   from '../sections/StudioSection';
import ServicesSection from '../sections/ServicesSection';
import ToolsSection    from '../sections/ToolsSection';
import ContactSection  from '../sections/ContactSection';
import { scrollToScene } from '../lib/nav';

export default function HomePage() {
  const { hash } = useLocation();

  // deep links like /#studio coming from other pages
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const t = window.setTimeout(() => scrollToScene(id, false), 60);
    return () => window.clearTimeout(t);
  }, [hash]);

  return (
    <>
      <HeroSection />
      <TalentsSection />
      <AboutSection />
      <StudioSection />
      <ServicesSection />
      <ToolsSection />
      <ContactSection />
    </>
  );
}
