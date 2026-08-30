import React from 'react';
import { X, Youtube, ExternalLink } from 'lucide-react';

interface VideoModalProps {
  videoUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  videoUrl,
  title,
  onClose,
}) => {
  if (!videoUrl) return null;

  // Extract YouTube embed ID
  let embedId = '';
  if (videoUrl.includes('youtube.com/watch?v=')) {
    embedId = videoUrl.split('watch?v=')[1]?.split('&')[0];
  } else if (videoUrl.includes('youtu.be/')) {
    embedId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
  } else if (videoUrl.length === 11) {
    embedId = videoUrl;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-[#111111] border border-black/20 rounded-3xl overflow-hidden shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2 text-sm font-bold text-white/90 line-clamp-1 pr-4">
            <Youtube className="w-5 h-5 text-[#ff3650] flex-shrink-0" />
            <span>{title || 'Trailer'}</span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close video"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Frame */}
        <div className="relative aspect-video w-full bg-black">
          {embedId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${embedId}?autoplay=1&rel=0`}
              title={title || 'Trailer'}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <p className="text-sm text-black/70 mb-4">Click below to watch on official YouTube channel:</p>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#ff3650] text-white px-6 py-3 rounded-full font-bold"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
