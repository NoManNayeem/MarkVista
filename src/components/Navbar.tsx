'use client';

import { useRouter } from 'next/navigation';
import { FileText, Github } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 md:gap-3 group"
          >
            <div className="p-1.5 md:p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MarkVista
            </span>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <a
              href="https://github.com/NoManNayeem/MarkVista"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 md:px-4 md:py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              aria-label="GitHub Repository"
            >
              <Github className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Star</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

