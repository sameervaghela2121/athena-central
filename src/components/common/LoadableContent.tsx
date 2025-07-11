import { FC, ReactNode } from "react";

interface LoadableContentProps {
  /**
   * Loading state flag
   */
  isLoading: boolean;
  
  /**
   * Content to display when not loading
   */
  content: ReactNode;
  
  /**
   * Optional custom skeleton component to show during loading
   */
  skeleton?: ReactNode;
  
  /**
   * Width class for the skeleton (default: "w-60")
   */
  skeletonWidth?: string;
  
  /**
   * Height class for the skeleton (default: "h-6")
   */
  skeletonHeight?: string;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * LoadableContent component that handles displaying either a loading skeleton or actual content
 * @param props Component properties
 * @returns A component that shows either a loading skeleton or the actual content
 */
const LoadableContent: FC<LoadableContentProps> = ({
  isLoading,
  content,
  skeleton,
  skeletonWidth = "w-60",
  skeletonHeight = "h-6",
  className = "",
}) => {
  /**
   * Renders the default skeleton loader if no custom skeleton is provided
   */
  const renderDefaultSkeleton = () => {
    try {
      return (
        <span 
          className={`${skeletonWidth} ${skeletonHeight} bg-gray-200 rounded animate-pulse ${className}`}
        ></span>
      );
    } catch (error) {
      console.error('renderDefaultSkeleton Error:', error);
      return null;
    }
  };

  return isLoading ? (skeleton || renderDefaultSkeleton()) : content;
};

export default LoadableContent;
