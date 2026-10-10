'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-14 h-7 rounded-full bg-slate/10 animate-pulse" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => {
        setTheme(isDark ? 'light' : 'dark');
      }}
      className={`
        relative inline-flex h-7 w-14 items-center rounded-full
        transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper
        ${isDark ? 'bg-slate/20 hover:bg-slate/30' : 'bg-slate/10 hover:bg-slate/20'}
      `}
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>

      {/* Sun icon background (left) */}
      <span
        className={`absolute left-1.5 flex h-4 w-4 items-center justify-center transition-opacity duration-300 ${isDark ? 'opacity-40 text-slate' : 'opacity-0'}`}
      >
        <Sun className="h-3 w-3" />
      </span>

      {/* Moon icon background (right) */}
      <span
        className={`absolute right-1.5 flex h-4 w-4 items-center justify-center transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-40 text-slate'}`}
      >
        <Moon className="h-3 w-3" />
      </span>

      {/* Sliding Thumb */}
      <span
        className={`
          inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-sheet shadow-sm ring-1 ring-border
          transition-transform duration-300 ease-out
          ${isDark ? 'translate-x-8' : 'translate-x-1'}
        `}
      >
        {isDark ? <Moon className="h-3 w-3 text-ink" /> : <Sun className="h-3 w-3 text-ink" />}
      </span>
    </button>
  );
}
