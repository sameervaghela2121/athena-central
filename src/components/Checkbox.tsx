import React, { AllHTMLAttributes } from "react";

interface Props extends AllHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  label?: any;
  id?: string;
  className?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const Checkbox: React.FC<Props> = ({
  checked = false,
  label,
  id,
  className = "",
  onChange,
  disabled = false,
}) => {
  return (
    <div className={`flex items-center custom-checkbox ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={className}
      />
      <label
        htmlFor={id}
        className={`select-none pl-2 tracking-wide ${disabled ? "opacity-65" : ""}`}
      >
        {label}
      </label>
    </div>
  );
};

export default React.memo(Checkbox);
