import React, { useCallback, useEffect, useState } from "react";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onHoverImage?: string;
  highlightDuration?: number;
}

const HoverImage: React.FC<ImageProps> = ({
  onHoverImage,
  highlightDuration,
  src,
  alt,
  ...rest
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (onHoverImage) {
      setCurrentSrc(onHoverImage);
      setIsHovered(true);

      if (highlightDuration) {
        setTimeout(() => {
          setCurrentSrc(src);
          setIsHovered(false);
        }, highlightDuration);
      }
    }
  };

  const handleMouseLeave = useCallback(() => {
    if (!highlightDuration) {
      setCurrentSrc(src);
      setIsHovered(false);
    }
  }, [src, highlightDuration]);

  useEffect(() => {
    if (!isHovered && !highlightDuration) {
      setCurrentSrc(src);
    }
  }, [isHovered, src, highlightDuration]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    />
  );
};

export default HoverImage;
