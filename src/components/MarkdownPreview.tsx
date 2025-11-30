'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  atomDark,
  tomorrow,
  vscDarkPlus,
  dracula,
  prism,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';
import type { SyntaxTheme } from './SyntaxThemeSelector';
import { getSmartDiagramName } from '@/lib/exportUtils';

interface MarkdownPreviewProps {
  content: string;
  syntaxTheme?: SyntaxTheme;
}

// Map theme names to actual style objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const syntaxThemeStyles: Record<SyntaxTheme, any> = {
  oneDark: oneDark,
  github: prism,  // Using prism as a light theme (github not available)
  vscDark: vscDarkPlus,
  dracula: dracula,
  atomDark: atomDark,
  tomorrow: tomorrow,
};

// Initialize Mermaid with better defaults
// Only initialize once (in browser environment)
if (typeof window !== 'undefined') {
  // Suppress Mermaid's internal logging by overriding console methods BEFORE initialization
  const originalError = console.error;
  const originalWarn = console.warn;

  // Temporarily suppress console during Mermaid initialization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.error = (...args: any[]) => {
    const msg = args.join(' ');
    if (!msg.includes('mermaid') && !msg.includes('Mermaid') && !msg.includes('Parse error')) {
      originalError.apply(console, args);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.warn = (...args: any[]) => {
    const msg = args.join(' ');
    if (!msg.includes('mermaid') && !msg.includes('Mermaid')) {
      originalWarn.apply(console, args);
    }
  };

  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default', // Use default theme (light background)
      securityLevel: 'loose',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      flowchart: { useMaxWidth: true, htmlLabels: true },
      themeVariables: {
        primaryColor: '#fff', // White background for nodes
        primaryTextColor: '#000',
        primaryBorderColor: '#000',
        lineColor: '#000',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#fff',
        background: '#ffffff', // Ensure white background
        mainBkg: '#ffffff',
        secondBkg: '#f3f4f6',
        tertiaryBkg: '#ffffff',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logLevel: 'fatal' as any, // Suppress all logging (fatal only)
    });
  } finally {
    // Restore console after initialization
    console.error = originalError;
    console.warn = originalWarn;
  }

  // Also suppress Mermaid's internal error queue if it exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mermaidAPI = (mermaid as any).mermaidAPI;
  if (mermaidAPI) {
    const originalLog = mermaidAPI.log;
    if (originalLog) {
      mermaidAPI.log = () => { }; // No-op
    }

    // Suppress error queue execution logging
    if (mermaidAPI.logger) {
      mermaidAPI.logger.error = () => { };
      mermaidAPI.logger.warn = () => { };
    }
  }
}

// Diagram counter for tracking multiple diagrams
const diagramCounters = new WeakMap<HTMLElement, number>();

// Function to download SVG as PNG with smart naming
const downloadDiagramAsPNG = async (svgElement: SVGElement) => {
  try {
    const svgClone = svgElement.cloneNode(true) as SVGElement;

    // Ensure SVG has proper dimensions and namespace
    if (!svgClone.getAttribute('xmlns')) {
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    // Remove any external references that might cause CORS issues
    // Remove xlink:href attributes that might reference external resources
    const allElements = svgClone.querySelectorAll('*');
    allElements.forEach((el) => {
      // Remove xlink:href if it points to external resources
      const xlinkHref = el.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (xlinkHref && (xlinkHref.startsWith('http://') || xlinkHref.startsWith('https://'))) {
        el.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      }
      // Remove href attributes pointing to external resources
      const href = el.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        el.removeAttribute('href');
      }
    });

    // Get SVG dimensions - prefer viewBox or width/height attributes
    let width = parseFloat(svgClone.getAttribute('width') || '0') || svgElement.getBoundingClientRect().width || 800;
    let height = parseFloat(svgClone.getAttribute('height') || '0') || svgElement.getBoundingClientRect().height || 600;

    // If viewBox exists, use it
    const viewBox = svgClone.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(' ');
      if (parts.length >= 4) {
        width = parseFloat(parts[2]) || width;
        height = parseFloat(parts[3]) || height;
      }
    }

    // Ensure dimensions are valid
    if (width <= 0) width = 800;
    if (height <= 0) height = 600;

    // Create a canvas to render the SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set canvas size with 2x resolution for better quality
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;

    // Scale context for high DPI
    ctx.scale(scale, scale);

    // Convert SVG to data URL using base64 encoding (more reliable than URI encoding)
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    const img = new Image();

    // Note: crossOrigin is not needed for data URLs as they are same-origin

    return new Promise<void>((resolve, reject) => {
      img.onload = () => {
        try {
          // Clear canvas and draw image
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas to blob and download
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }

            // Get or increment diagram counter for this section
            const container = svgElement.closest('.mermaid-container');
            let diagramIndex = 1;
            if (container && container.parentElement) {
              const currentCount = diagramCounters.get(container.parentElement as HTMLElement) || 0;
              diagramIndex = currentCount + 1;
              diagramCounters.set(container.parentElement as HTMLElement, diagramIndex);
            }

            // Generate smart filename based on section
            const fileName = getSmartDiagramName(svgElement, diagramIndex);

            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            console.log('Diagram downloaded:', fileName);
            resolve();
          }, 'image/png', 1.0);
        } catch (drawError) {
          reject(drawError);
        }
      };

      img.onerror = (error) => {
        reject(new Error(`Failed to load SVG as image: ${error}`));
      };

      // Use data URL instead of blob URL to avoid CORS issues
      img.src = dataUrl;
    });
  } catch (error) {
    throw error;
  }
};

export default function MarkdownPreview({ content, syntaxTheme = 'oneDark' }: MarkdownPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedThemeStyle = syntaxThemeStyles[syntaxTheme];

  useEffect(() => {
    const renderMermaid = async () => {
      if (!containerRef.current) return;

      const mermaidElements = containerRef.current.querySelectorAll('.mermaid-code');

      // Suppress console errors from Mermaid temporarily
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const suppressedErrors: string[] = [];

      // Override console.error to catch Mermaid parse errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error = (...args: any[]) => {
        const errorStr = args.join(' ');
        // Check if it's a Mermaid parsing/execution error
        if (
          errorStr.includes('Parse error') ||
          errorStr.includes('Error parsing') ||
          errorStr.includes('Error executing queue') ||
          errorStr.includes('DIAMOND_START') ||
          errorStr.includes('mermaid')
        ) {
          suppressedErrors.push(errorStr);
          // Don't log to console, we'll handle it in UI
          return;
        }
        // Log other errors normally
        originalConsoleError.apply(console, args);
      };

      // Also suppress console.warn for Mermaid warnings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.warn = (...args: any[]) => {
        const warnStr = args.join(' ');
        if (warnStr.includes('mermaid') || warnStr.includes('Mermaid')) {
          return; // Suppress Mermaid warnings
        }
        originalConsoleWarn.apply(console, args);
      };

      for (let i = 0; i < mermaidElements.length; i++) {
        const element = mermaidElements[i];
        try {
          const code = element.textContent || '';

          // Validate that we have code
          if (!code.trim()) {
            element.innerHTML = '<p class="text-yellow-600 p-4 bg-yellow-50 rounded">Empty diagram code</p>';
            element.classList.remove('mermaid-code');
            continue;
          }

          const id = `mermaid-${Date.now()}-${i}`;

          // Use mermaid's parse and render methods with better error handling
          // Wrap in a try-catch that also suppresses Mermaid's internal error logging
          try {
            // Suppress console during parse/render
            const tempError = console.error;
            const tempWarn = console.warn;
            let mermaidErrorCaught = false;
            let caughtErrorMessage = '';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.error = (...args: any[]) => {
              const msg = args.join(' ');
              if (
                msg.includes('Parse error') ||
                msg.includes('Error parsing') ||
                msg.includes('Error executing queue') ||
                msg.includes('DIAMOND_START') ||
                msg.includes('mermaid') ||
                msg.includes('Mermaid')
              ) {
                mermaidErrorCaught = true;
                caughtErrorMessage = msg;
                return; // Suppress
              }
              tempError.apply(console, args);
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.warn = (...args: any[]) => {
              const msg = args.join(' ');
              if (msg.includes('mermaid') || msg.includes('Mermaid')) {
                return; // Suppress
              }
              tempWarn.apply(console, args);
            };

            try {
              // First, try to parse the diagram to catch syntax errors early
              await mermaid.parse(code);

              // If parsing succeeds, render it
              const { svg } = await mermaid.render(id, code);

              // Wait a bit for any async error queue processing
              await new Promise(resolve => setTimeout(resolve, 50));

              // Restore console before checking for errors
              console.error = tempError;
              console.warn = tempWarn;

              if (mermaidErrorCaught) {
                throw new Error(caughtErrorMessage || 'Mermaid diagram syntax error');
              }

              // Find the parent container (the div with bg-gray-50)
              const parentContainer = element.closest('.mermaid-container') || element.parentElement;

              // Create wrapper for SVG and download button
              const wrapper = document.createElement('div');
              wrapper.className = 'relative';

              // Set the SVG content
              wrapper.innerHTML = svg;
              element.innerHTML = '';
              element.appendChild(wrapper);
              element.classList.remove('mermaid-code');
              element.classList.add('mermaid-rendered');

              // Add right-click context menu functionality
              const svgElement = wrapper.querySelector('svg');
              if (svgElement) {
                svgElement.setAttribute('data-mermaid-diagram', 'true');

                // Get or create shared context menu (one for all diagrams)
                let contextMenu = document.getElementById('mermaid-context-menu') as HTMLDivElement;
                if (!contextMenu) {
                  contextMenu = document.createElement('div');
                  contextMenu.id = 'mermaid-context-menu';
                  contextMenu.className = 'fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl py-1 z-[9999] min-w-[180px] hidden no-print';
                  contextMenu.innerHTML = `
                    <button class="context-menu-item w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      <span>Download as PNG</span>
                    </button>
                  `;
                  document.body.appendChild(contextMenu);

                  // Add global download handler (only once)
                  const downloadMenuItem = contextMenu.querySelector('.context-menu-item') as HTMLButtonElement;
                  downloadMenuItem.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const targetSvg = (contextMenu as any).__currentSvgElement as SVGElement | null;
                    if (!targetSvg) {
                      return;
                    }

                    contextMenu.classList.add('hidden');

                    try {
                      downloadMenuItem.disabled = true;
                      downloadMenuItem.classList.add('opacity-50', 'cursor-not-allowed');
                      await downloadDiagramAsPNG(targetSvg);
                      downloadMenuItem.disabled = false;
                      downloadMenuItem.classList.remove('opacity-50', 'cursor-not-allowed');
                    } catch (error) {
                      console.error('Failed to download diagram:', error);
                      alert('Failed to download diagram. Please try again.');
                      downloadMenuItem.disabled = false;
                      downloadMenuItem.classList.remove('opacity-50', 'cursor-not-allowed');
                    } finally {
                      (contextMenu as any).__currentSvgElement = null;
                    }
                  });
                }

                // Handle right-click to show context menu
                const handleContextMenu = (e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // Store the target SVG element on the context menu
                  (contextMenu as any).__currentSvgElement = svgElement;

                  // Position context menu at cursor
                  const x = e.clientX;
                  const y = e.clientY;
                  contextMenu.style.left = `${x}px`;
                  contextMenu.style.top = `${y}px`;
                  contextMenu.classList.remove('hidden');

                  // Close menu when clicking elsewhere
                  const closeMenu = (event: MouseEvent) => {
                    const target = event.target as HTMLElement;
                    if (!contextMenu.contains(target)) {
                      contextMenu.classList.add('hidden');
                      (contextMenu as any).__currentSvgElement = null;
                      document.removeEventListener('click', closeMenu);
                      document.removeEventListener('contextmenu', closeMenu);
                    }
                  };

                  // Close on next click or right-click
                  setTimeout(() => {
                    document.addEventListener('click', closeMenu, { once: true });
                    document.addEventListener('contextmenu', closeMenu, { once: true });
                  }, 0);
                };

                svgElement.addEventListener('contextmenu', handleContextMenu);
              }
            } catch (parseError) {
              // Restore console before handling error
              console.error = tempError;
              console.warn = tempWarn;
              throw parseError;
            }
          } catch (parseError) {
            // Handle parsing errors more gracefully
            const errorMsg = parseError instanceof Error ? parseError.message :
              (typeof parseError === 'object' && parseError !== null && 'str' in parseError ? String(parseError.str) :
                suppressedErrors[0] || 'Unknown diagram syntax error');

            // Extract readable error message
            let displayMsg = errorMsg;
            if (errorMsg.includes('Parse error on line')) {
              const match = errorMsg.match(/Parse error on line \d+:([\s\S]+?)(?:\n|$)/);
              if (match) {
                displayMsg = `Syntax error: ${match[1].trim()}`;
              }
            }

            element.innerHTML = `
              <div class="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p class="text-red-800 font-semibold mb-2">⚠️ Diagram Syntax Error</p>
                <p class="text-red-600 text-sm mb-2">${displayMsg.substring(0, 200)}${displayMsg.length > 200 ? '...' : ''}</p>
                <details class="mt-2">
                  <summary class="text-red-700 text-xs cursor-pointer hover:text-red-900">Show diagram code</summary>
                  <pre class="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">${code}</pre>
                </details>
                <p class="text-red-500 text-xs mt-2">
                  💡 Tip: Check your Mermaid syntax. Paths with curly braces like <code class="bg-red-100 px-1 rounded">\{uid\}</code> may need to be quoted or escaped.
                </p>
              </div>
            `;
            element.classList.remove('mermaid-code');
            element.classList.add('mermaid-error');

            // Clear suppressed errors for this element
            suppressedErrors.length = 0;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : (suppressedErrors[0] || 'Failed to render diagram');

          element.innerHTML = `
            <div class="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p class="text-red-800 font-semibold mb-2">⚠️ Diagram Error</p>
              <p class="text-red-600 text-sm">${errorMsg}</p>
            </div>
          `;
          element.classList.remove('mermaid-code');
          element.classList.add('mermaid-error');
        }
      }

      // Restore original console methods
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };

    // Setup context menu for code blocks
    const setupCodeBlockContextMenu = () => {
      if (!containerRef.current) return;

      const codeBlocks = containerRef.current.querySelectorAll('.code-block-container');

      // Get or create shared context menu for code blocks
      let codeContextMenu = document.getElementById('code-context-menu') as HTMLDivElement;
      if (!codeContextMenu) {
        codeContextMenu = document.createElement('div');
        codeContextMenu.id = 'code-context-menu';
        codeContextMenu.className = 'fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl py-1 z-[9999] min-w-[180px] hidden no-print';
        codeContextMenu.innerHTML = `
          <button class="code-context-menu-item w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <span>Copy code</span>
          </button>
        `;
        document.body.appendChild(codeContextMenu);

        // Add global copy handler (only once)
        const copyMenuItem = codeContextMenu.querySelector('.code-context-menu-item') as HTMLButtonElement;
        copyMenuItem.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();

          const codeContent = (codeContextMenu as any).__currentCodeContent as string | null;
          if (!codeContent) {
            return;
          }

          try {
            await navigator.clipboard.writeText(codeContent);
            codeContextMenu.classList.add('hidden');

            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 z-[10000] px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg text-sm font-medium transition-opacity';
            notification.textContent = 'Code copied to clipboard!';
            document.body.appendChild(notification);

            setTimeout(() => {
              notification.style.opacity = '0';
              setTimeout(() => notification.remove(), 300);
            }, 2000);
          } catch (error) {
            console.error('Failed to copy code:', error);
            alert('Failed to copy code. Please try again.');
          } finally {
            (codeContextMenu as any).__currentCodeContent = null;
          }
        });
      }

      // Attach context menu handler to each code block
      codeBlocks.forEach((codeBlock) => {
        const handleContextMenu = (e: Event) => {
          const mouseEvent = e as MouseEvent;
          mouseEvent.preventDefault();
          mouseEvent.stopPropagation();

          const codeContent = (codeBlock as HTMLElement).getAttribute('data-code-content') || '';
          if (!codeContent) {
            // Fallback: try to extract text from the code block
            const codeElement = codeBlock.querySelector('code') || codeBlock.querySelector('pre');
            const fallbackContent = codeElement?.textContent || '';
            (codeContextMenu as any).__currentCodeContent = fallbackContent;
          } else {
            (codeContextMenu as any).__currentCodeContent = codeContent;
          }

          // Position context menu at cursor
          const x = mouseEvent.clientX;
          const y = mouseEvent.clientY;
          codeContextMenu.style.left = `${x}px`;
          codeContextMenu.style.top = `${y}px`;
          codeContextMenu.classList.remove('hidden');

          // Close menu when clicking elsewhere
          const closeMenu = (event: Event) => {
            const target = (event as MouseEvent).target as HTMLElement;
            if (!codeContextMenu.contains(target)) {
              codeContextMenu.classList.add('hidden');
              (codeContextMenu as any).__currentCodeContent = null;
              document.removeEventListener('click', closeMenu);
              document.removeEventListener('contextmenu', closeMenu);
            }
          };

          // Close on next click or right-click
          setTimeout(() => {
            document.addEventListener('click', closeMenu, { once: true });
            document.addEventListener('contextmenu', closeMenu, { once: true });
          }, 0);
        };

        // Remove existing listener if any and add new one
        codeBlock.removeEventListener('contextmenu', handleContextMenu);
        codeBlock.addEventListener('contextmenu', handleContextMenu);
      });
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      renderMermaid();
      setupCodeBlockContextMenu();
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div
      ref={containerRef}
      id="markdown-preview"
      className="markdown-body"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          // CODE BLOCKS WITH MERMAID SUPPORT
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            // Mermaid diagrams
            if (lang === 'mermaid' && !inline) {
              return (
                <div className="my-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 mermaid-container">
                  <div className="mermaid-code">{codeString}</div>
                </div>
              );
            }

            // Syntax highlighted code
            if (!inline && match) {
              return (
                <div className="my-6 rounded-lg overflow-hidden shadow-sm code-block-container" data-code-content={codeString}>
                  <SyntaxHighlighter
                    style={selectedThemeStyle}
                    language={lang}
                    PreTag="div"
                    showLineNumbers
                    customStyle={{
                      margin: '0',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                    } as React.CSSProperties}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            // Inline code
            return (
              <code
                className="bg-gray-100 dark:bg-gray-700 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },

          // HEADINGS with proper spacing
          h1({ children, ...props }) {
            return (
              <h1
                className="text-4xl font-bold mt-8 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                style={{ pageBreakAfter: 'avoid' }}
                {...props}
              >
                {children}
              </h1>
            );
          },

          h2({ children, ...props }) {
            return (
              <h2
                className="text-3xl font-semibold mt-8 mb-4 text-gray-800 dark:text-gray-200"
                style={{ pageBreakAfter: 'avoid' }}
                {...props}
              >
                {children}
              </h2>
            );
          },

          h3({ children, ...props }) {
            return (
              <h3
                className="text-2xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200"
                style={{ pageBreakAfter: 'avoid' }}
                {...props}
              >
                {children}
              </h3>
            );
          },

          // PARAGRAPHS with proper spacing
          p({ children, ...props }) {
            return (
              <p
                className="text-base leading-7 mb-4 text-gray-700 dark:text-gray-300"
                {...props}
              >
                {children}
              </p>
            );
          },

          // TABLES - styled beautifully
          table({ children, ...props }) {
            return (
              <div className="my-6 overflow-x-auto" style={{ pageBreakInside: 'avoid' }}>
                <table
                  className="min-w-full border-collapse border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },

          thead({ children, ...props }) {
            return (
              <thead className="bg-gray-100 dark:bg-gray-700" {...props}>
                {children}
              </thead>
            );
          },

          th({ children, ...props }) {
            return (
              <th
                className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100"
                {...props}
              >
                {children}
              </th>
            );
          },

          td({ children, ...props }) {
            return (
              <td
                className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300"
                {...props}
              >
                {children}
              </td>
            );
          },

          // BLOCKQUOTES
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-blue-500 dark:border-blue-400 pl-6 py-3 my-6 italic bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 rounded-r"
                {...props}
              >
                {children}
              </blockquote>
            );
          },

          // LISTS with proper spacing
          ul({ children, ...props }) {
            return (
              <ul
                className="list-disc list-outside ml-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300"
                {...props}
              >
                {children}
              </ul>
            );
          },

          ol({ children, ...props }) {
            return (
              <ol
                className="list-decimal list-outside ml-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300"
                {...props}
              >
                {children}
              </ol>
            );
          },

          // LINKS
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },

          // HORIZONTAL RULE
          hr({ ...props }) {
            return (
              <hr
                className="my-8 border-t-2 border-gray-300 dark:border-gray-600"
                {...props}
              />
            );
          },

          // IMAGES - Using standard img for markdown content (can't use Next Image with dynamic markdown)
          img({ src, alt, ...props }) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt}
                className="max-w-full h-auto rounded-lg shadow-md my-6"
                style={{ pageBreakInside: 'avoid' }}
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

