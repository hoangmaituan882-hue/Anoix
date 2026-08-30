import React from 'react';

/**
 * Film poster with a no-image fallback: when `image` is empty, render a
 * gradient block + the title (first 2 chars) instead of a broken <img>.
 */
export const FilmPoster: React.FC<{
  image?: string | null;
  alt?: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ image, alt, title, className, style }) => {
  if (image) {
    return <img src={image} alt={alt} className={className} loading="lazy" style={style} />;
  }
  return (
    <div className={`${className ?? ''} bg-gradient-to-br from-[#2a2a2a] to-[#151515] flex items-center justify-center`} style={style}>
      <span className="text-black/25 font-black tracking-widest select-none">
        {(title || '?').slice(0, 2)}
      </span>
    </div>
  );
};