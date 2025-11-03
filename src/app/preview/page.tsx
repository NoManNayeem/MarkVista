'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, Loader2, Printer } from 'lucide-react';
import MarkdownPreview from '@/components/MarkdownPreview';
import GitHubStarModal from '@/components/GitHubStarModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SyntaxThemeSelector, type SyntaxTheme } from '@/components/SyntaxThemeSelector';
import { TableOfContents } from '@/components/TableOfContents';
import { exportToPDF } from '@/lib/exportPDF';
import { exportToDOCX } from '@/lib/exportDOCX';

export default function PreviewPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isExporting, setIsExporting] = useState<'pdf' | 'docx' | 'print' | null>(null);
  const [syntaxTheme, setSyntaxTheme] = useState<SyntaxTheme>('oneDark');
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load syntax theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('syntaxTheme') as SyntaxTheme;
    if (savedTheme) {
      setSyntaxTheme(savedTheme);
    }
  }, []);

  // Save syntax theme to localStorage
  const handleSyntaxThemeChange = (theme: SyntaxTheme) => {
    setSyntaxTheme(theme);
    localStorage.setItem('syntaxTheme', theme);
  };

  useEffect(() => {
    const savedContent = sessionStorage.getItem('markdownContent');
    const savedFileName = sessionStorage.getItem('fileName');

    if (!savedContent) {
      router.push('/');
      return;
    }

    setContent(savedContent);
    setFileName(savedFileName || 'document.md');
  }, [router]);

  const handleExportPDF = async () => {
    if (!previewRef.current) return;

    setIsExporting('pdf');
    setError(null);

    try {
      // Wait for Mermaid diagrams to render
      await new Promise(resolve => setTimeout(resolve, 500));

      await exportToPDF({
        fileName: fileName.replace(/\.(md|markdown)$/, ''),
        element: previewRef.current,
      });

      // Show success notification
      showNotification('PDF exported successfully!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`PDF export failed: ${errorMessage}`);
      showNotification('PDF export failed. Please try again.', 'error');
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportDOCX = async () => {
    if (!previewRef.current) return;

    setIsExporting('docx');
    setError(null);

    try {
      // Wait for Mermaid diagrams to render
      await new Promise(resolve => setTimeout(resolve, 500));

      await exportToDOCX({
        fileName: fileName.replace(/\.(md|markdown)$/, ''),
        element: previewRef.current,
      });

      showNotification('DOCX exported successfully!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`DOCX export failed: ${errorMessage}`);
      showNotification('DOCX export failed. Please try again.', 'error');
      console.error('DOCX export error:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handlePrint = () => {
    setIsExporting('print');
    try {
      window.print();
    } catch (error) {
      console.error('Print error:', error);
      showNotification('Print failed. Please try again.', 'error');
    } finally {
      // Delay to allow print dialog to show
      setTimeout(() => setIsExporting(null), 1000);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification - you can enhance this with a toast library
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-[100] px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-opacity ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* GitHub Star Modal */}
      <GitHubStarModal />

      {/* Table of Contents */}
      <TableOfContents />

      {/* Error Banner */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm no-print transition-colors">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between gap-2 md:gap-4 mb-3">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                aria-label="Go back"
                title="Back to upload"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 text-gray-700 dark:text-gray-300" />
              </button>
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base truncate">
                {fileName}
              </span>
            </div>

            <ThemeToggle />
          </div>

          {/* Bottom Row - Export Actions */}
          <div className="flex items-center justify-between gap-2 md:gap-3 flex-wrap">
            <SyntaxThemeSelector
              currentTheme={syntaxTheme}
              onThemeChange={handleSyntaxThemeChange}
            />

            <div className="flex gap-2 md:gap-3 flex-shrink-0">
              <button
                onClick={handlePrint}
                disabled={isExporting !== null}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base shadow-sm"
                title="Print document (preserves hyperlinks)"
              >
                {isExporting === 'print' ? (
                  <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                ) : (
                  <Printer className="h-3.5 w-3.5 md:h-4 md:w-4" />
                )}
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExporting !== null}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base shadow-sm"
                title="Export as PDF"
                aria-label="Export document as PDF"
              >
                {isExporting === 'pdf' ? (
                  <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
                )}
                <span className="hidden sm:inline">
                  {isExporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
                </span>
                <span className="sm:hidden">PDF</span>
              </button>

              <button
                onClick={handleExportDOCX}
                disabled={isExporting !== null}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base shadow-sm"
                title="Export as DOCX"
                aria-label="Export document as DOCX"
              >
                {isExporting === 'docx' ? (
                  <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
                )}
                <span className="hidden sm:inline">
                  {isExporting === 'docx' ? 'Exporting...' : 'Export DOCX'}
                </span>
                <span className="sm:hidden">DOCX</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Preview */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div
          ref={previewRef}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12 transition-colors"
        >
          <MarkdownPreview content={content} syntaxTheme={syntaxTheme} />
        </div>
      </div>
    </main>
  );
}
