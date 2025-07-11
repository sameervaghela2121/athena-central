import { get } from "lodash-es";
import React, { InputHTMLAttributes } from "react";
import { Controller } from "react-hook-form";
import ErrorText from "./ErrorText";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  placeholder?: string;
  label?: string;
  textBoxClasses?: string;
  required?: boolean;
  control?: any;
  errors?: any;
  name: string;
  type?: "text" | "password" | "number" | "date" | "email";
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  className?: string;
  value?: string;
  info?: React.ReactNode;
  disabled?: boolean;
  onEnter?: () => void;
}

const Input: React.FC<Props> = (props) => {
  const {
    id = "",
    label = "",
    name,
    control,
    errors,
    min,
    max,
    maxLength,
    disabled = false,
    className,
    value = "",
    onChange,
    type = "text",
    placeholder = "",
    textBoxClasses = "",
    onEnter,
  } = props;

  const allowOnlyNumber = (value: string) => {
    const val = value.replace(/[^0-9]/g, "");
    // return value.replace(/[^0-9]/g, "");
    // trim val if greater hen then 10 digits
    return val.length > parseInt(`${max ?? Infinity}`)
      ? val.substring(0, parseInt(`${max ?? Infinity}`))
      : val;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) {
      onEnter(); // Call the onEnter prop with the input value
    }
  };

  const classes = `p-[11px] rounded-lg border border-tertiary-200/50 w-full outline-none disabled:bg-tertiary-50 ${textBoxClasses}`;

  return (
    <div
      className={`${get(errors, `${name}.message`) ? "error" : ""} ${className}`}
    >
      <label className="cursor-pointer" htmlFor={id}>
        {label}
      </label>

      {control ? (
        <Controller
          render={({ field }) => (
            <>
              {type === "number" ? (
                <input
                  {...field}
                  onChange={(e) =>
                    field.onChange(allowOnlyNumber(e.target.value))
                  }
                  id={id}
                  min={min}
                  max={max}
                  readOnly={disabled}
                  placeholder={placeholder}
                  type={type}
                  className={classes}
                  autoComplete="off"
                />
              ) : (
                <input
                  {...field}
                  id={id}
                  disabled={disabled}
                  readOnly={disabled}
                  placeholder={placeholder}
                  type={type}
                  className={classes}
                  autoComplete="off"
                />
              )}
            </>
          )}
          name={name}
          control={control}
          defaultValue=""
        />
      ) : (
        <input
          placeholder={placeholder}
          readOnly={disabled}
          maxLength={maxLength}
          min={min}
          max={max}
          name={name}
          value={value}
          type={type}
          onKeyDown={handleKeyDown} // Handle key down events
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange && onChange(e)
          }
          className={classes}
          autoComplete="off"
        />
      )}

      <ErrorText errors={errors} name={name} />
    </div>
  );
};

export default Input;
// export default React.memo(Input);
