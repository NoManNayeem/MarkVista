'use client';

import { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

export type SyntaxTheme = 'oneDark' | 'github' | 'vscDark' | 'dracula' | 'atomDark' | 'tomorrow';

interface SyntaxThemeSelectorProps {
  currentTheme: SyntaxTheme;
  onThemeChange: (theme: SyntaxTheme) => void;
}

const themes: { value: SyntaxTheme; label: string; description: string }[] = [
  { value: 'oneDark', label: 'One Dark', description: 'Atom One Dark theme' },
  { value: 'github', label: 'GitHub', description: 'GitHub light theme' },
  { value: 'vscDark', label: 'VS Code Dark', description: 'Visual Studio Code dark' },
  { value: 'dracula', label: 'Dracula', description: 'Popular dark theme' },
  { value: 'atomDark', label: 'Atom Dark', description: 'Atom editor dark theme' },
  { value: 'tomorrow', label: 'Tomorrow', description: 'Tomorrow theme' },
];

export function SyntaxThemeSelector({ currentTheme, onThemeChange }: SyntaxThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by mounting client-side only
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.syntax-theme-selector')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  const currentThemeLabel = themes.find(t => t.value === currentTheme)?.label || 'One Dark';

  return (
    <div className="relative syntax-theme-selector">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
        title="Select syntax highlighting theme"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">{currentThemeLabel}</span>
        <span className="sm:hidden">Theme</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Syntax Highlighting Theme
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Choose your preferred code theme
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => {
                  onThemeChange(theme.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3 flex items-start gap-3 transition-colors text-left
                  ${
                    currentTheme === theme.value
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {currentTheme === theme.value ? (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    currentTheme === theme.value
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {theme.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {theme.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
