'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import MarkdownPreview from '@/components/MarkdownPreview';
import GitHubStarModal from '@/components/GitHubStarModal';
import { exportToPDF } from '@/lib/exportPDF';
import { exportToDOCX } from '@/lib/exportDOCX';

export default function PreviewPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isExporting, setIsExporting] = useState<'pdf' | 'docx' | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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
    try {
      // Wait for Mermaid diagrams to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await exportToPDF({
        fileName: fileName.replace(/\.(md|markdown)$/, ''),
        element: previewRef.current,
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`PDF export failed: ${errorMessage}\n\nPlease try again or check the browser console for details.`);
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportDOCX = async () => {
    if (!previewRef.current) return;
    setIsExporting('docx');
    try {
      // Wait for Mermaid diagrams to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await exportToDOCX({
        fileName: fileName.replace(/\.(md|markdown)$/, ''),
        element: previewRef.current,
      });
    } catch (error) {
      alert('DOCX export failed. Please try again.');
      console.error(error);
    } finally {
      setIsExporting(null);
    }
  };

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* GitHub Star Modal */}
      <GitHubStarModal />

      {/* Toolbar */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm no-print">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600 flex-shrink-0" />
            <span className="font-semibold text-gray-900 text-sm md:text-base truncate">{fileName}</span>
          </div>

          <div className="flex gap-2 md:gap-3 flex-shrink-0">
            <button
              onClick={handleExportPDF}
              disabled={isExporting !== null}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base"
            >
              {isExporting === 'pdf' ? (
                <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
              )}
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              onClick={handleExportDOCX}
              disabled={isExporting !== null}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base"
            >
              {isExporting === 'docx' ? (
                <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
              )}
              <span className="hidden sm:inline">Export DOCX</span>
              <span className="sm:hidden">DOCX</span>
            </button>
          </div>
        </div>
      </header>

      {/* Preview */}
      <div className="container mx-auto px-4 py-8">
        <div ref={previewRef}>
          <MarkdownPreview content={content} />
        </div>
      </div>
    </main>
  );
}

