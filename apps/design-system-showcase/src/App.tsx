import { useState, useEffect } from 'react';
import Topbar from './ui/Topbar';
import Sidebar from './ui/Sidebar';
import ThemeEditor from './ui/ThemeEditor';
import { sections } from './sections';
import { compileThemeToCSS, type ThemeJSON } from '@plataforma/design-system';

type Theme = 'light' | 'dark' | 'custom';
type Density = 'compact' | 'cozy' | 'tv';

export default function App() {
  const [theme, setTheme] = useState<Theme>('light');
  const [density, setDensity] = useState<Density>('cozy');
  const [radius, setRadius] = useState<'sharp' | 'soft' | 'round'>('round');
  const [activeSection, setActiveSection] = useState(sections[0].id);

  // Custom theme states
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customTheme, setCustomTheme] = useState<ThemeJSON | null>(null);

  useEffect(() => {
    if (!customTheme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, customTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  useEffect(() => {
    document.documentElement.setAttribute('data-radius', radius);
  }, [radius]);

  // Dynamic Theme CSS Compilation and Injection
  useEffect(() => {
    let styleElement = document.getElementById('ds-custom-theme-styles');
    
    if (!customTheme) {
      if (styleElement) {
        styleElement.remove();
      }
      return;
    }

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'ds-custom-theme-styles';
      document.head.appendChild(styleElement);
    }

    // Compile custom theme JSON to CSS variables targetting [data-theme="custom"]
    // @ts-expect-error ThemeJSON has nested theme; function auto-unwraps
    const compiledCSS = compileThemeToCSS(customTheme, ':root[data-theme="custom"]');
    styleElement.textContent = compiledCSS;
    document.documentElement.setAttribute('data-theme', 'custom');
  }, [customTheme]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: '-10% 0px -75% 0px' },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <div className="min-h-screen">
      <Topbar
        theme={customTheme ? 'custom' : theme}
        setTheme={(t) => {
          if (t === 'light' || t === 'dark') {
            setCustomTheme(null);
            setTheme(t);
          }
        }}
        density={density}
        setDensity={setDensity}
        radius={radius}
        setRadius={setRadius}
        isCustomizerOpen={isCustomizerOpen}
        setIsCustomizerOpen={setIsCustomizerOpen}
        customThemeActive={customTheme !== null}
      />
      <div className="flex max-w-[1400px] mx-auto">
        <Sidebar sections={sections} activeSection={activeSection} />
        <main className={`flex-1 min-w-0 px-[clamp(1.5rem,4vw,4rem)] py-12 transition-all duration-300 ${isCustomizerOpen ? 'pr-[400px]' : ''}`}>
          {sections.map(({ id, component: Section }) => (
            <Section key={id} />
          ))}
        </main>
      </div>
      <ThemeEditor
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        customTheme={customTheme}
        setCustomTheme={setCustomTheme}
      />
    </div>
  );
}
