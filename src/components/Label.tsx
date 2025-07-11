import React from "react";

interface Props extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = ({
  children,
  className = "",
  required = false,
  ...rest
}: Props) => {
  return (
    <label className={`font-medium select-none ${className}`} {...rest}>
      {children}

      {required && <span className="ml-1 text-status-error">*</span>}
    </label>
  );
};

export default React.memo(Label);
