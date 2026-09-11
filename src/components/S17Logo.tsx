import React, { useState } from 'react';
import { S17_LOGO_DATA_URI } from '../data/s17LogoData';

interface S17LogoProps {
  className?: string;
  size?: number | string;
  showSubtitle?: boolean;
}

export const S17Logo: React.FC<S17LogoProps> = ({
  className = '',
  size = 120,
}) => {
  // Use the embedded S1-7 Logo image data URI directly for instant, reliable rendering
  const [imgSrc, setImgSrc] = useState<string>(S17_LOGO_DATA_URI);

  const handleError = () => {
    if (imgSrc !== '/s1-7-logo.png') {
      setImgSrc('/s1-7-logo.png');
    }
  };

  const dim = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src={imgSrc}
      alt="Secondary 1-7: Learning to Learn and Grow Together"
      onError={handleError}
      className={`object-contain select-none transition-transform duration-200 ${className}`}
      style={{
        width: dim,
        height: dim,
        maxWidth: '100%',
      }}
      referrerPolicy="no-referrer"
      loading="eager"
    />
  );
};
