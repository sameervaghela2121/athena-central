import { uniqBy } from "lodash-es";
import React, { useState } from "react";
import { Controller } from "react-hook-form";
import { components } from "react-select";
import makeAnimated from "react-select/animated";
import CreatableSelect from "react-select/creatable";

import allImgPaths from "@/assets";
import ClearIndicator from "./ClearIndicator";
import ErrorText from "./ErrorText";
const animatedComponents = makeAnimated();

interface Props {
  id?: string;
  placeholder?: string;
  control?: any;
  errors?: any;
  name: string;
  onChange?: (e: any) => void;
  className?: string;
  value?: string[];
  disabled?: boolean;
}

const KeywordSelector = ({
  id,
  value = [],
  placeholder,
  control,
  errors,
  onChange,
  name,
  className,
  disabled = false,
}: Props) => {
  const [fieldValue, setFieldValue] = useState("");

  // Create a custom multiValueRemove component
  const CustomMultiValueRemove = (props: any) => (
    <components.MultiValueRemove {...props}>
      <img
        src={allImgPaths.closeIcon}
        className="w-3 h-3"
        onClick={() => props.removeProps.onClick()}
      />
    </components.MultiValueRemove>
  );

  const customComponents = {
    DropdownIndicator: () => null, // Removes dropdown indicator
    IndicatorSeparator: () => null, // Removes the separator
    // ClearIndicator: () => null, // Removes the clear button
    Menu: () => null, // Removes the dropdown menu
    MultiValueRemove: CustomMultiValueRemove,
    ClearIndicator: ClearIndicator,
    animatedComponents,
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? "#EBEBEB" : "", // Change border color on focus
      borderRadius: "8px",
      boxShadow: "none", // Removes the default focus border shadow
      "&:hover": {
        borderColor: "#EBEBEB", // Change border color on hover
      },
    }),

    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: "#f2eeee", // Background color of each selected value
      borderRadius: "8px",
      margin: 0,
      padding: "2px",
      display: "flex",
      columnGap: "8px",
      border: "1px solid #f2eeee",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: "#333", // Text color of the label
      // textTransform: "capitalize",
    }),
    multiValueRemove: (provided: any, state: any) => ({
      ...provided,
      color: state.isFocused ? "" : "#555", // Change color when hovered or focused
      cursor: "pointer",
    }),
    valueContainer: (provided: any, state: any) => ({
      ...provided,
      padding: "8px",
      gap: "2px",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#9ca3af",
    }),
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    callback: (data: any) => void,
  ) => {
    if (
      event.key === "Enter" ||
      event.key === ";" ||
      // event.key === " " ||
      event.key === ","
    ) {
      if (fieldValue) {
        const newOption = { label: fieldValue, value: fieldValue };
        callback(newOption);
        event.preventDefault(); // Prevent the default behavior
      }
    }
  };

  return (
    <>
      {control ? (
        <Controller
          name={name}
          control={control}
          defaultValue=""
          render={({ field }) => (
            <CreatableSelect
              isDisabled={disabled}
              className={className}
              id={id}
              isMulti
              options={[]}
              placeholder={placeholder}
              components={customComponents}
              styles={customStyles}
              inputValue={fieldValue || ""}
              onInputChange={(newValue) => {
                setFieldValue(newValue);
              }}
              onKeyDown={(event) =>
                handleKeyDown(event, (value) => {
                  const newOptions = uniqBy([...field.value, value], (obj) =>
                    obj.label.toLowerCase(),
                  );

                  if (newOptions.length !== field.value.length) {
                    field.onChange(newOptions);
                    setFieldValue("");
                  }
                })
              }
              {...field}
              onChange={(value) => {
                field.onChange(value);
              }}
              onBlur={() => {
                if (
                  fieldValue &&
                  !value.some((option: any) => option.label === fieldValue)
                ) {
                  const newOption = { label: fieldValue, value: fieldValue };

                  field.onChange([...field.value, newOption]);
                }
              }}
            />
          )}
        />
      ) : (
        <CreatableSelect
          isMulti
          options={[]}
          placeholder={placeholder}
          components={customComponents}
          styles={customStyles}
          value={value}
          inputValue={fieldValue || ""}
          onInputChange={(newValue) => {
            setFieldValue(newValue);
          }}
          onKeyDown={(event) =>
            handleKeyDown(event, (val) => {
              const newOptions = uniqBy([...value, val], (obj) =>
                obj.label.toLowerCase(),
              );

              if (newOptions.length !== value.length) {
                onChange && onChange(newOptions);
                setFieldValue("");
              }
            })
          }
          onChange={(value) => {
            onChange && onChange(value);
          }}
          onBlur={() => {
            if (
              fieldValue &&
              !value.some((option: any) => option.label === fieldValue)
            ) {
              const newOption = { label: fieldValue, value: fieldValue };

              onChange && onChange([...value, newOption]);
            }
          }}
        />
      )}
      <ErrorText errors={errors} name={name} />
    </>
  );
};

export default React.memo(KeywordSelector);
