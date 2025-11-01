'use client';

import { useEffect, useState } from 'react';
import { X, Star, Github } from 'lucide-react';

interface GitHubStarModalProps {
  repoUrl?: string;
}

export default function GitHubStarModal({ repoUrl = 'https://github.com/NoManNayeem/MarkVista' }: GitHubStarModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if modal has been shown before
    const hasSeenModal = localStorage.getItem('markvista-star-modal-shown');
    
    // Show modal once, only if not seen before
    if (!hasSeenModal) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Mark as seen
    localStorage.setItem('markvista-star-modal-shown', 'true');
  };

  const handleStarClick = () => {
    window.open(repoUrl, '_blank', 'noopener,noreferrer');
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-in zoom-in-95 duration-300 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <Star className="h-8 w-8 text-white fill-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Enjoying MarkVista?
          </h2>
          <p className="text-gray-600 mb-6">
            If you find this tool useful, please consider giving it a star on GitHub. It helps others discover MarkVista!
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStarClick}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Github className="h-5 w-5" />
              Star on GitHub
            </button>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Maybe Later
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            This will only show once
          </p>
        </div>
      </div>
    </div>
  );
}

