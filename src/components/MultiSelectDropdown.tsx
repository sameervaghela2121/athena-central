import allImgPaths from "@/assets/index";
import useOutsideClick from "@/hooks/useOutSideClick";
import useWindowSize from "@/hooks/useWindowSize";
import { classes } from "@/shared/functions";
import { Option } from "@/shared/types";
import { size, startCase, toLower } from "lodash-es";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { tv } from "tailwind-variants";
import Checkbox from "./Checkbox";

interface DropdownProps {
  options: Option[];
  value: Option[];
  placeholder?: string;
  onSelect: (selectedOptions: Option[]) => void;
  tooltip?: boolean;
  showChips?: boolean;
  containerClasses?: string;
  dropdownContainerClasses?: string;
  type?: "primary" | "secondary";
  label?: string;
}

interface SelectedOptionsProps {
  selectedOptions: Option[];
  handleRemove: (value: string | number) => void;
}

const button = tv({
  base: "w-full bg-white text-tertiary-300 gap-1 rounded flex justify-between items-center border border-transparent outline-none",
  variants: {
    type: {
      secondary: "bg-gray",
      primary: "",
    },
    active: {
      true: "bg-white border border-primary-500 shadow-[0px_2px_8px_1px_#0A0A381A]",
    },
  },
});

const list = tv({
  base: "flex cursor-pointer gap-2 hover:bg-gray-100 px-4 py-2 border-l border-l-transparent relative hover:border-l-primary-900 border-l-2 border-l-transparent",
  variants: {
    active: {
      true: "selected-menu font-semibold text-[rgb(0_51_102_/_var(--tw-bg-opacity))] border-solid",
    },
  },
});

const listContainer = tv({
  base: "absolute z-10 mt-1 rounded bg-white shadow-[0px_2px_12px_3px_#0A0A381A] max-h-96 h-auto transition-all duration-200 transform origin-top overflow-auto scrollbar-thin",
  variants: {
    active: {
      true: "opacity-100 scale-100",
      false: "opacity-0 scale-75 h-0 overflow-hidden",
    },
  },
});

const RenderChips: React.FC<SelectedOptionsProps> = ({
  selectedOptions,
  handleRemove,
}) => {
  return (
    <div className="flex flex-wrap gap-2 select-none">
      {selectedOptions.map(({ label, value }) => (
        <div
          key={value}
          className="flex items-center h-[30px] gap-2 border px-2.5 py-[5px] rounded-[15px] bg-white"
        >
          <span className="truncate max-w-32" title={label}>
            {label}
          </span>
          <img
            src={allImgPaths.closeIcon}
            className="w-3 h-3 transition-transform duration-200 cursor-pointer hover:scale-110"
            alt="close"
            onClick={() => handleRemove(value)}
          />
        </div>
      ))}
    </div>
  );
};

const MultiSelectDropdown: React.FC<DropdownProps> = ({
  options,
  value = [],
  onSelect,
  placeholder = "Select",
  tooltip = false,
  showChips = false,
  containerClasses = "",
  dropdownContainerClasses = "",
  type = "primary",
  label = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Option[]>(value);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({}); // To store dropdown position

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const typeClasses = type === "secondary" ? "bg-gray" : "";

  const handleToggle = () => setIsOpen(!isOpen);
  const dimension = useWindowSize();

  useOutsideClick(dropdownRef, () => setIsOpen(false), buttonRef); // Hide dropdown on outside click

  useEffect(() => {
    onSelect(selectedOptions);
  }, [selectedOptions]);

  // Function to check if an option is selected
  const isSelected = (value: number | string) => {
    return selectedOptions.some((option) => option.value === value);
  };

  const handleSelect = React.useCallback(
    (option: Option) => {
      if (option.value === 0) {
        // If "All" is selected or deselected
        if (isSelected(0)) {
          setSelectedOptions([]); // Uncheck all
        } else {
          setSelectedOptions(options); // Select all
        }
      } else {
        // If a specific option is selected
        let newSelected: Option[];

        if (isSelected(option.value)) {
          newSelected = selectedOptions.filter(
            (opt) => opt.value !== option.value,
          ); // Remove it if already selected
        } else {
          newSelected = [...selectedOptions, option]; // Add it if not selected
        }

        // If all options (except "All") are selected, include "All"
        if (newSelected.length === options.length - 1 && !isSelected(0)) {
          newSelected.push(options[0]); // Select "All" automatically
        }

        // If "All" is selected but a specific option is unselected, unselect "All"
        if (isSelected(0) && newSelected.length < options.length) {
          newSelected = newSelected.filter((opt) => opt.value !== 0); // Unselect "All"
        }

        setSelectedOptions(newSelected);
      }
    },
    [isSelected, options, selectedOptions],
  );

  const handleRemove = (value: string | number) => {
    setSelectedOptions((prevSelected) =>
      prevSelected.filter((option) => option.value !== value),
    );
  };

  // Calculate the dropdown position based on the button
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const htmlRect = (triggerRef.current as any).getBoundingClientRect();

      setDropdownStyles({
        top: `${rect.bottom + window.scrollY}px`, // Set the dropdown below the button
        left: `${rect.left}px`,
        width: `${htmlRect.width}px`,
      });
    }
  }, [isOpen, dimension]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = ""; // Reset overflow style on cleanup
    };
  }, [isOpen]);

  const dropdown = isOpen
    ? ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyles}
          className={listContainer({
            active: isOpen,
            class: dropdownContainerClasses,
          })}
        >
          <ul className="rounded-md select-none divide-y max-h-[300px] overflow-y-auto">
            {size(options) > 0 ? (
              options.map((o: any) => (
                <li
                  title={tooltip ? o.label : ""}
                  key={o.value}
                  className={list({
                    active: value.some(
                      (option: any) => option.value === o.value,
                    ),
                  })}
                  onClick={() => handleSelect(o)}
                >
                  <Checkbox
                    checked={value.some(
                      (option: any) => option.value === o.value,
                    )}
                    onChange={() => {}}
                  />
                  <div className="w-full truncate">
                    <span>{startCase(toLower(o.label))}</span>
                  </div>
                </li>
              ))
            ) : (
              <li className={list()}>
                <div className="truncate">
                  <span>No options</span>
                </div>
              </li>
            )}
          </ul>
        </div>,
        document.body, // Append to the body, outside of the parent div
      )
    : null;

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="select-none">{label}</span>}
      <div
        ref={triggerRef}
        className={classes(
          "relative rounded inline-block w-full cursor-pointer px-4",
          containerClasses,
          typeClasses,
        )}
      >
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className={button({
            type: type,
            // active: type === "secondary" && isOpen ? true : false,
          })}
        >
          <span className="truncate select-none">{placeholder}</span>
          <div>
            <img
              src={allImgPaths.dropDownIcon}
              alt="arrow-icon"
              className={`${isOpen ? "rotate-180 duration-200" : "duration-200"} select-none`}
            />
          </div>
        </button>
        {dropdown}
      </div>
      {showChips && (
        <RenderChips handleRemove={handleRemove} selectedOptions={value} />
      )}
    </div>
  );
};

export default MultiSelectDropdown;
