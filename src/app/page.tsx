'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Download, Code, Zap, Palette, FileCode, Image, FileCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HomePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      // Validate file
      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
        throw new Error('Please upload a .md or .markdown file');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Read file content
      const content = await file.text();

      if (!content.trim()) {
        throw new Error('File is empty');
      }

      // Store in sessionStorage
      sessionStorage.setItem('markdownContent', content);
      sessionStorage.setItem('fileName', file.name);

      // Navigate to preview
      router.push('/preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 md:py-20 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                <FileText className="h-10 w-10 md:h-12 md:w-12 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MarkVista
                </span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto mb-6 md:mb-8 px-4">
                Professional Markdown preview and export tool. Transform your markdown files into beautifully formatted PDF and DOCX documents.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base text-gray-600">
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" /> Fast & Lightweight
                </span>
                <span className="flex items-center gap-1">
                  <FileCheck className="h-4 w-4 text-green-500" /> No Account Required
                </span>
                <span className="flex items-center gap-1">
                  <Download className="h-4 w-4 text-blue-500" /> Free Forever
                </span>
              </div>
            </div>

            {/* Upload Area */}
            <div className="max-w-2xl mx-auto mb-16 md:mb-20">
              <div
                onDragOver={onDragOver}
                onDrop={onDrop}
                className="border-4 border-dashed border-gray-300 rounded-2xl p-8 md:p-12 lg:p-16 text-center bg-white hover:border-blue-400 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".md,.markdown"
                  onChange={onFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 border-b-4 border-blue-600 mx-auto mb-6" />
                  ) : (
                    <Upload className="h-16 w-16 md:h-20 md:w-20 text-gray-400 mx-auto mb-6" />
                  )}
                  <div className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-700 mb-2 md:mb-3">
                    {isUploading ? 'Uploading...' : 'Drop your .md file here'}
                  </div>
                  <div className="text-base md:text-lg text-gray-500">
                    or <span className="text-blue-600 font-medium hover:underline">browse files</span>
                  </div>
                </label>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm md:text-base">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12 md:mb-16">
              Powerful Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Code,
                  title: 'Rich Formatting',
                  desc: 'Full GitHub Flavored Markdown support with syntax highlighting, tables, task lists, and more.',
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  icon: Image,
                  title: 'Interactive Diagrams',
                  desc: 'Mermaid.js support for flowcharts, sequence diagrams, mind maps. Click diagrams to download as images.',
                  color: 'from-purple-500 to-purple-600'
                },
                {
                  icon: FileCode,
                  title: 'Math Equations',
                  desc: 'Beautiful LaTeX math rendering with KaTeX. Support for inline and block equations.',
                  color: 'from-green-500 to-green-600'
                },
                {
                  icon: Download,
                  title: 'PDF Export',
                  desc: 'Export to high-quality PDF with preserved styles, fonts, and formatting. Perfect for sharing and printing.',
                  color: 'from-red-500 to-red-600'
                },
                {
                  icon: FileCheck,
                  title: 'DOCX Export',
                  desc: 'Export to Microsoft Word format with all formatting preserved. Compatible with all Word processors.',
                  color: 'from-indigo-500 to-indigo-600'
                },
                {
                  icon: Palette,
                  title: 'Beautiful Themes',
                  desc: 'Clean, modern interface with responsive design. Works perfectly on desktop, tablet, and mobile.',
                  color: 'from-pink-500 to-pink-600'
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${feature.color} rounded-lg mb-4 shadow-md`}>
                    <feature.icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12 md:mb-16">
              How It Works
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                {[
                  { step: '1', title: 'Upload', desc: 'Drag and drop your .md file or click to browse' },
                  { step: '2', title: 'Preview', desc: 'See your markdown rendered with beautiful formatting' },
                  { step: '3', title: 'Export', desc: 'Download as PDF or DOCX with preserved styles' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white text-2xl md:text-3xl font-bold mb-4 shadow-lg">
                      {item.step}
                    </div>
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
