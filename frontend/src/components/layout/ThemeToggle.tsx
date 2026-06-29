import React, { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (t: Theme) => {
      root.classList.remove('light', 'dark');
      
      if (t === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(t);
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen to system theme changes if set to system
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-lg border border-surface-3">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-surface-0 shadow-sm text-brand-500' : 'text-ink-500 hover:text-ink-900'}`}
        title="Light Mode"
      >
        <Sun size={14} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md transition-colors ${theme === 'system' ? 'bg-surface-0 shadow-sm text-brand-500' : 'text-ink-500 hover:text-ink-900'}`}
        title="System Theme"
      >
        <Monitor size={14} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-surface-0 shadow-sm text-brand-500' : 'text-ink-500 hover:text-ink-900'}`}
        title="Dark Mode"
      >
        <Moon size={14} />
      </button>
    </div>
  );
}
