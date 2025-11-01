'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';

interface MarkdownPreviewProps {
  content: string;
}

// Initialize Mermaid with better defaults
// Only initialize once (in browser environment)
if (typeof window !== 'undefined') {
  // Suppress Mermaid's internal logging by overriding console methods BEFORE initialization
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Temporarily suppress console during Mermaid initialization
  console.error = (...args: any[]) => {
    const msg = args.join(' ');
    if (!msg.includes('mermaid') && !msg.includes('Mermaid') && !msg.includes('Parse error')) {
      originalError.apply(console, args);
    }
  };
  
  console.warn = (...args: any[]) => {
    const msg = args.join(' ');
    if (!msg.includes('mermaid') && !msg.includes('Mermaid')) {
      originalWarn.apply(console, args);
    }
  };
  
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      flowchart: { useMaxWidth: true, htmlLabels: true },
      logLevel: 'fatal' as any, // Suppress all logging (fatal only)
    });
  } finally {
    // Restore console after initialization
    console.error = originalError;
    console.warn = originalWarn;
  }
  
  // Also suppress Mermaid's internal error queue if it exists
  const mermaidAPI = (mermaid as any).mermaidAPI;
  if (mermaidAPI) {
    const originalLog = mermaidAPI.log;
    if (originalLog) {
      mermaidAPI.log = () => {}; // No-op
    }
    
    // Suppress error queue execution logging
    if (mermaidAPI.logger) {
      mermaidAPI.logger.error = () => {};
      mermaidAPI.logger.warn = () => {};
    }
  }
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMermaid = async () => {
      if (!containerRef.current) return;

      const mermaidElements = containerRef.current.querySelectorAll('.mermaid-code');
      
      // Suppress console errors from Mermaid temporarily
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const suppressedErrors: string[] = [];
      
      // Override console.error to catch Mermaid parse errors
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
              
              element.innerHTML = svg;
              element.classList.remove('mermaid-code');
              element.classList.add('mermaid-rendered');
              
              // Add click-to-download functionality
              const svgElement = element.querySelector('svg');
              if (svgElement) {
                // Add cursor pointer and tooltip
                svgElement.style.cursor = 'pointer';
                svgElement.setAttribute('title', 'Click to download as PNG image');
                svgElement.setAttribute('data-mermaid-diagram', 'true');
                
                // Add click handler to download the diagram
                svgElement.addEventListener('click', async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  try {
                    // Get the SVG element
                    const svgToDownload = e.currentTarget as SVGElement;
                    const svgClone = svgToDownload.cloneNode(true) as SVGElement;
                    
                    // Ensure SVG has proper dimensions and namespace
                    if (!svgClone.getAttribute('xmlns')) {
                      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    }
                    
                    // Get SVG dimensions - prefer viewBox or width/height attributes
                    let width = parseFloat(svgClone.getAttribute('width') || '0') || svgToDownload.getBoundingClientRect().width || 800;
                    let height = parseFloat(svgClone.getAttribute('height') || '0') || svgToDownload.getBoundingClientRect().height || 600;
                    
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
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    
                    // Set canvas size with 2x resolution for better quality
                    const scale = 2;
                    canvas.width = width * scale;
                    canvas.height = height * scale;
                    
                    // Scale context for high DPI
                    ctx.scale(scale, scale);
                    
                    // Convert SVG to data URL (base64 encoded)
                    const svgData = new XMLSerializer().serializeToString(svgClone);
                    
                    // Create image from SVG
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(svgBlob);
                    
                    const img = new Image();
                    
                    img.onload = () => {
                      try {
                        // Clear canvas and draw image
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convert canvas to blob and download
                        canvas.toBlob((blob) => {
                          if (!blob) {
                            console.error('Failed to create blob from canvas');
                            alert('Failed to generate image. Please try again.');
                            URL.revokeObjectURL(url);
                            return;
                          }
                          
                          const downloadUrl = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = downloadUrl;
                          a.download = `mermaid-diagram-${Date.now()}.png`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(downloadUrl);
                          URL.revokeObjectURL(url);
                        }, 'image/png', 1.0);
                      } catch (drawError) {
                        console.error('Failed to draw image on canvas:', drawError);
                        alert('Failed to render diagram. Please try again.');
                        URL.revokeObjectURL(url);
                      }
                    };
                    
                    img.onerror = () => {
                      console.error('Failed to load SVG as image');
                      alert('Failed to load diagram as image. Please try again.');
                      URL.revokeObjectURL(url);
                    };
                    
                    img.src = url;
                  } catch (error) {
                    console.error('Failed to download diagram:', error);
                    alert('Failed to download diagram. Please try again.');
                  }
                });
              }
            } catch (parseError: any) {
              // Restore console before handling error
              console.error = tempError;
              console.warn = tempWarn;
              throw parseError;
            }
          } catch (parseError: any) {
            // Handle parsing errors more gracefully
            const errorMsg = parseError?.message || parseError?.str || suppressedErrors[0] || 'Unknown diagram syntax error';
            
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
        } catch (error: any) {
          const errorMsg = error?.message || suppressedErrors[0] || 'Failed to render diagram';
          
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

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      renderMermaid();
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div 
      ref={containerRef}
      id="markdown-preview"
      className="markdown-body bg-white p-12 min-h-screen"
      style={{
        maxWidth: '210mm', // A4 width
        margin: '0 auto',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          // CODE BLOCKS WITH MERMAID SUPPORT
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            // Mermaid diagrams
            if (lang === 'mermaid' && !inline) {
              return (
                <div className="my-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="mermaid-code">{codeString}</div>
                </div>
              );
            }

            // Syntax highlighted code
            if (!inline && match) {
              return (
                <div className="my-6 rounded-lg overflow-hidden shadow-sm">
                  <SyntaxHighlighter
                    style={oneDark}
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
                className="bg-gray-100 text-pink-600 px-2 py-0.5 rounded text-sm font-mono" 
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
                className="text-4xl font-bold mt-8 mb-6 pb-3 border-b-2 border-gray-300 text-gray-900"
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
                className="text-3xl font-semibold mt-8 mb-4 text-gray-800"
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
                className="text-2xl font-semibold mt-6 mb-3 text-gray-800"
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
                className="text-base leading-7 mb-4 text-gray-700"
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
                  className="min-w-full border-collapse border-2 border-gray-300 shadow-sm"
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },

          thead({ children, ...props }) {
            return (
              <thead className="bg-gray-100" {...props}>
                {children}
              </thead>
            );
          },

          th({ children, ...props }) {
            return (
              <th 
                className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900"
                {...props}
              >
                {children}
              </th>
            );
          },

          td({ children, ...props }) {
            return (
              <td 
                className="border border-gray-300 px-4 py-3 text-gray-700"
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
                className="border-l-4 border-blue-500 pl-6 py-3 my-6 italic bg-blue-50 text-gray-700 rounded-r"
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
                className="list-disc list-outside ml-6 mb-4 space-y-2 text-gray-700"
                {...props}
              >
                {children}
              </ul>
            );
          },

          ol({ children, ...props }) {
            return (
              <ol 
                className="list-decimal list-outside ml-6 mb-4 space-y-2 text-gray-700"
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
                className="text-blue-600 hover:text-blue-800 underline"
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
                className="my-8 border-t-2 border-gray-300"
                {...props}
              />
            );
          },

          // IMAGES
          img({ src, alt, ...props }) {
            return (
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

