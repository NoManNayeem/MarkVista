'use client';

import { useEffect, useState } from 'react';
import { List, X, ChevronRight } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  containerId?: string;
}

export function TableOfContents({ containerId = 'markdown-preview' }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from markdown preview
    const container = document.getElementById(containerId);
    if (!container) return;

    const headingElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const extractedHeadings: Heading[] = [];

    headingElements.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent || '';

      // Create or get ID for the heading
      let id = heading.id;
      if (!id) {
        id = `heading-${index}-${text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50)}`;
        heading.id = id;
      }

      extractedHeadings.push({ id, text, level });
    });

    // DOM extraction needs to run in effect, disable linter warning
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeadings(extractedHeadings);
  }, [containerId]);

  useEffect(() => {
    // Track active heading on scroll
    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean);

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const heading = headingElements[i];
        if (heading) {
          const rect = heading.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveId(heading.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });

      // Close on mobile after click
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 lg:hidden"
        title="Table of Contents"
        aria-label="Toggle table of contents"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        ) : (
          <List className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside
        className={`
          fixed right-4 top-32 z-40 w-72 max-h-[calc(100vh-10rem)] overflow-y-auto
          bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'}
          scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent
        `}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <List className="w-4 h-4" />
              Table of Contents
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Close table of contents"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <nav className="p-3">
          <ul className="space-y-1">
            {headings.map((heading) => (
              <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}>
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-start gap-2
                    ${
                      activeId === heading.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      activeId === heading.id ? 'rotate-90' : ''
                    }`}
                  />
                  <span className="flex-1 line-clamp-2">{heading.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
