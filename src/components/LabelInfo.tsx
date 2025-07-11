import React from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  required?: boolean;
}

const LabelInfo = ({
  children,
  className = "",
  required = false,
  ...rest
}: Props) => {
  return (
    <div
      className={`select-none text-sm italic text-tertiary-400 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default React.memo(LabelInfo);
