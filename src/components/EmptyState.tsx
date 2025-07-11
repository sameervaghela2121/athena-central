import React from "react";

type EmptyStateProps = {
  header?: React.ReactNode;
  description: React.ReactNode;
  headingLevel?: number;
  primaryAction?: React.ReactNode;
  imageUrl?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  header,
  description,
  headingLevel = 2,
  primaryAction,
  imageUrl,
}) => {
  const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;

  return (
    <div className="flex flex-col items-center p-6 text-center">
      {imageUrl && (
        <img src={imageUrl} alt="empty state" className="w-24 h-24 mb-4" />
      )}
      <HeadingTag className="w-full mb-2 text-2xl font-semibold md:w-3/4 lg:w-4/5">
        {header}
      </HeadingTag>
      <div className="flex justify-center mb-4 text-gray-600">
        {description}
      </div>
      {primaryAction && <div>{primaryAction}</div>}
    </div>
  );
};

export default React.memo(EmptyState);
