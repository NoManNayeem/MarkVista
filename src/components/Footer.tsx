'use client';

import { Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-white font-bold text-lg mb-3">MarkVista</h3>
            <p className="text-sm text-gray-400">
              Professional Markdown preview and export tool. Transform your markdown files into beautifully formatted PDF and DOCX documents.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/NoManNayeem/MarkVista"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/NoManNayeem/MarkVista/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Report Issue
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-3">Support</h4>
            <p className="text-sm text-gray-400 mb-3">
              If you find MarkVista useful, consider giving it a star on GitHub!
            </p>
            <a
              href="https://github.com/NoManNayeem/MarkVista"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              <Github className="h-4 w-4" />
              Star on GitHub
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 text-center md:text-left">
            © {new Date().getFullYear()} MarkVista. Made with <Heart className="inline h-4 w-4 text-red-500 fill-red-500" /> by{' '}
            <a
              href="https://github.com/NoManNayeem"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              NoManNayeem
            </a>
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Open Source</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-500">MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

