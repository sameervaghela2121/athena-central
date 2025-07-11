import allImgPaths from "@/assets/index";
import useOutsideClick from "@/hooks/useOutSideClick";
import useWindowSize from "@/hooks/useWindowSize";
import { classes } from "@/shared/functions";
import { Option } from "@/shared/types";
import { size, startCase, toLower } from "lodash-es";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { tv } from "tailwind-variants";

interface DropdownProps {
  options: Option[];
  value: Option;
  placeholder?: string;
  onSelect: (option: Option) => void;
  tooltip?: boolean;
  showChips?: boolean;
  containerClasses?: string;
  dropdownContainerClasses?: string;
  type?: "primary" | "secondary";
  label?: string;
}

const button = tv({
  base: "w-full bg-white text-tertiary-300 gap-1 rounded flex justify-between items-center border border-transparent",
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
  base: "flex cursor-pointer gap-2 hover:bg-gray-100 px-4 py-2 border-l border-l-transparent relative hover:border-l-primary-900 border-l-2 border-l-transparent ",
  variants: {
    active: {
      true: "selected-menu font-semibold text-[rgb(0_51_102_/_var(--tw-bg-opacity))] border-solid",
    },
  },
});

const listContainer = tv({
  base: "max-w-max absolute z-10 mt-1 w-full rounded bg-white shadow-[0px_2px_12px_3px_#0A0A381A] max-h-96 h-auto transition-all duration-200 transform origin-top overflow-auto scrollbar-thin",
  variants: {
    active: {
      true: "opacity-100 scale-100",
      false: "opacity-0 scale-75 h-0 overflow-hidden",
    },
  },
});

const SelectDropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onSelect,
  placeholder = "Select",
  tooltip = false,
  containerClasses = "",
  dropdownContainerClasses = "",
  type = "primary",
  label = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({}); // To store dropdown position

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dimension = useWindowSize();

  const typeClasses = type === "secondary" ? "bg-gray" : "";

  const handleToggle = () => setIsOpen(!isOpen);

  useOutsideClick(dropdownRef, () => setIsOpen(false), buttonRef); // Hide dropdown on outside click

  const handleSelect = (value: { label: string; value: number | string }) => {
    onSelect(value);
  };

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      setDropdownStyles({
        top: `${rect.bottom + window.scrollY}px`, // Set the dropdown below the button
        left: `${rect.left}px`,
        // width: `${rect.width}px`,
      });
    }
  }, [isOpen, dimension]);

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
          <ul className="rounded-md divide-y select-none">
            {size(options) > 0 ? (
              options.map(({ label, value: val }, index) => (
                <li
                  title={tooltip ? label : ""}
                  key={index}
                  className={list({
                    active: label === value?.label,
                  })}
                  onClick={() => handleSelect({ label, value: val })}
                >
                  <div className="w-full truncate">
                    <span>{startCase(toLower(label))}</span>
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
    <div className="flex flex-col gap-1 px-2 pt-1.5">
      {label && <span className="select-none">{label}</span>}
      <div
        className={classes(
          "inline-block relative w-full rounded cursor-pointer",
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
              className={`${isOpen ? "duration-200 rotate-180" : "duration-200"} select-none`}
            />
          </div>
        </button>
        {dropdown}
      </div>
    </div>
  );
};

export default SelectDropdown;
