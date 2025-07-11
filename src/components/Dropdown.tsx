import allImgPaths from "@/assets";
import { size } from "lodash-es";
import React, { useEffect, useRef, useState } from "react";
import useOutsideClick from "../hooks/useOutSideClick";

type DropdownItem = {
  [key: string]: any;
};

type DropdownProps = {
  label?: any;
  items: DropdownItem[];
  selectedItem?: DropdownItem | null;
  onSelect: (item: DropdownItem) => void;
  className?: string;
  preFixIcon?: string;
  btnName?: string;
  disabled?: boolean;
  dropDownIcon?: string;
  hideCarat?: boolean;
  listClassName?: string;
};

/**
 * Dropdown component that can position its menu at top or bottom based on available space
 */
const Dropdown: React.FC<DropdownProps> = ({
  label,
  items,
  selectedItem,
  onSelect,
  preFixIcon,
  className,
  btnName = "",
  disabled = false,
  hideCarat = false,
  dropDownIcon = allImgPaths.dropDownIcon,
  listClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAbove, setShowAbove] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownListRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);
  useOutsideClick(dropdownRef, () => setIsOpen(false));

  /**
   * Check if there's enough space below the dropdown button
   * If not, position the dropdown above the button
   */
  const checkPosition = () => {
    try {
      if (!dropdownRef.current || !dropdownListRef.current) return;

      const buttonRect = dropdownRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownListRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;

      setShowAbove(
        spaceBelow < dropdownHeight && buttonRect.top > dropdownHeight,
      );
    } catch (error) {
      console.error("checkPosition Error:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to ensure the dropdown is rendered before measuring
      setTimeout(checkPosition, 0);
      window.addEventListener("resize", checkPosition);
      window.addEventListener("scroll", checkPosition);
    }

    return () => {
      window.removeEventListener("resize", checkPosition);
      window.removeEventListener("scroll", checkPosition);
    };
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`inline-block relative w-full text-left rounded-lg ${className}`}
    >
      <button
        disabled={disabled}
        type="button"
        onClick={toggleDropdown}
        className={`select-none w-full h-full flex items-center gap-x-2.5 justify-between rounded-lg border border-tertiary-50 pr-2 pl-4 sm:text-base font-medium text-tertiary-800 focus:outline-none disabled:bg-tertiary-50 py-1 px-2 sm:py-2 text-xs ${btnName}`}
      >
        {preFixIcon && <img src={preFixIcon} alt="" />}

        <span className="truncate line-clamp-1">
          {label ? label : selectedItem ? selectedItem.name : ""}
        </span>

        {!hideCarat && (
          <img src={dropDownIcon} alt="dropDownIcon" className="w-5" />
        )}
      </button>

      {isOpen && size(items) > 0 && (
        <div
          ref={dropdownListRef}
          className={`fixed right-0 z-[9999] min-w-52 overflow-hidden w-full bg-white rounded-md ring-1 ring-black ring-opacity-5 shadow-lg ${showAbove ? "mb-2 origin-bottom-right" : "mt-2 origin-top-right"}`}
          style={{
            width: dropdownRef.current?.offsetWidth || "auto",
            left: dropdownRef.current?.getBoundingClientRect().left || 0,
            [showAbove ? "bottom" : "top"]: showAbove
              ? dropdownRef.current
                ? window.innerHeight -
                  dropdownRef.current.getBoundingClientRect().top
                : 0
              : dropdownRef.current?.getBoundingClientRect().bottom || 0,
          }}
        >
          <ul className={`overflow-y-auto py-1 max-h-[160px] ${listClassName}`}>
            {items.map((item) => (
              <li
                key={item.id || item.value}
                onClick={() => {
                  onSelect(item);
                  setIsOpen(false);
                }}
                className={`select-none border-l-transparent ${(selectedItem ? selectedItem.id || selectedItem.value : "") === (item.id || item.value) ? "!border-l-primary-900 bg-gray-100 text-gray-900" : ""} hover:border-l-primary-900 cursor-pointer border-l-2  block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left`}
              >
                {item.name || item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
