import React from "react";

import { Control, Controller } from "react-hook-form";
import { tv } from "tailwind-variants";

import ErrorText from "./ErrorText";
import StringCounter from "./StringCounter";

interface TextInputProps {
  type?: "text" | "textarea" | "number";
  value?: string | number;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  variant?: "primary" | "secondary";
  name: string;
  id?: string;
  label?: string;
  readOnly?: boolean;
  disabled?: boolean;
  control?: Control<any>;
  errors?: any;
  maxChar?: number;
  onEnter?: () => void;
}

const textBox = tv({
  base: "border rounded-md p-[11px] focus:outline-none focus:border focus:border-tertiary-200/50 scrollbar-thin",

  variants: {
    type: {
      secondary: "bg-gray focus:bg-white",
      primary: "",
    },
  },
});

const Textarea: React.FC<TextInputProps> = ({
  type = "textarea",
  value,
  onChange,
  placeholder = "Enter text",
  className,
  rows = 3,
  variant = "primary",
  name,
  id,
  label = "",
  readOnly = false,
  disabled = false,
  control,
  errors,
  onEnter,
  maxChar = 0,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && onEnter && !e.shiftKey) {
      e.preventDefault(); // Prevents adding a new line
      onEnter(); // Trigger onEnter with the textarea value
    }
  };

  return (
    <div className="flex flex-col">
      {label && (
        <label className="self-start select-none" htmlFor={name}>
          {label}
        </label>
      )}

      {type === "textarea" ? (
        control ? (
          <Controller
            render={({ field }) => (
              <div className="relative">
                <textarea
                  {...field}
                  placeholder={placeholder}
                  className={`${textBox({ type: variant })} min-h-10 w-full border-tertiary-200/50 disabled:bg-tertiary-50 ${className}`}
                  rows={rows}
                  id={id}
                  autoComplete="off"
                  readOnly={readOnly}
                  disabled={disabled}
                />
                <StringCounter limit={maxChar} value={field.value} />
              </div>
            )}
            name={name}
            control={control}
            defaultValue=""
          />
        ) : (
          <textarea
            value={value as string}
            onChange={onChange}
            placeholder={placeholder}
            className={`${textBox({ type: variant })} min-h-10 disabled:bg-tertiary-50 ${className}`}
            rows={rows}
            id={name}
            readOnly={readOnly}
            disabled={disabled}
            onKeyDown={handleKeyDown} // Handle key down events
          />
        )
      ) : control ? (
        <Controller
          render={({ field }) => (
            <input
              {...field}
              type={type}
              placeholder={placeholder}
              className={`${textBox({ type: variant })} min-h-10 disabled:bg-tertiary-50 ${className}`}
              id={id}
              autoComplete="off"
              readOnly={readOnly}
              disabled={disabled}
            />
          )}
          name={name}
          control={control}
          defaultValue=""
        />
      ) : (
        <input
          type={type}
          readOnly={readOnly}
          disabled={disabled}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${textBox({ type: variant })} disabled:bg-tertiary-50 ${className}`}
        />
      )}

      <ErrorText errors={errors} name={name} />
    </div>
  );
};

// export default memo(Textarea);
export default Textarea;
