'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after component is mounted to avoid hydration mismatch
  // This is the recommended pattern for next-themes to prevent hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
        <button className="p-2 rounded-md w-9 h-9" disabled>
          <Monitor className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200 dark:bg-gray-700 transition-colors">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-all ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-600 shadow-sm'
            : 'hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        title="Light mode"
        aria-label="Switch to light mode"
      >
        <Sun
          className={`w-5 h-5 ${
            theme === 'light'
              ? 'text-yellow-500'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md transition-all ${
          theme === 'system'
            ? 'bg-white dark:bg-gray-600 shadow-sm'
            : 'hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        title="System mode"
        aria-label="Switch to system mode"
      >
        <Monitor
          className={`w-5 h-5 ${
            theme === 'system'
              ? 'text-blue-500'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-all ${
          theme === 'dark'
            ? 'bg-white dark:bg-gray-600 shadow-sm'
            : 'hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        title="Dark mode"
        aria-label="Switch to dark mode"
      >
        <Moon
          className={`w-5 h-5 ${
            theme === 'dark'
              ? 'text-indigo-500'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        />
      </button>
    </div>
  );
}
