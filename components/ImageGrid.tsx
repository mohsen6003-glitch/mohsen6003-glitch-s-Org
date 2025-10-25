
import React from 'react';
import type { GeneratedImage } from '../types';

interface ImageGridProps {
  images: GeneratedImage[];
  onImageClick: (image: GeneratedImage) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, onImageClick }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="aspect-[9/16] bg-light-bg rounded-lg overflow-hidden cursor-pointer group transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-brand-purple/30"
          onClick={() => onImageClick(image)}
        >
          <img
            src={image.base64}
            alt="AI generated wallpaper"
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};
