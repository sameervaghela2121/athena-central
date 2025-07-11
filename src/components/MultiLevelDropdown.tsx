import allImgPaths from "@/assets";
import { includes, isEmpty, size } from "lodash-es";
import React, { useEffect, useRef, useState } from "react";
import useOutsideClick from "../hooks/useOutSideClick";
import Checkbox from "./Checkbox";
import Divider from "./Divider";

type DropdownProps = {
  label?: any;
  items: Record<string, string[]>;
  onSelect: (item: any) => void;
  className?: string;
  preFixIcon?: string;
  disabled?: boolean;
  dropDownIcon?: string;
  hideCarat?: boolean;
  listClassName?: string;
  btnName?: string;
  defaultValue?: Record<string, string[]>;
};

const MultiLevelHoverDropdown: React.FC<DropdownProps> = ({
  label,
  items,
  onSelect,
  preFixIcon,
  className,
  disabled = false,
  hideCarat = false,
  dropDownIcon = allImgPaths.dropDownIcon,
  listClassName = "",
  btnName = "",
  defaultValue = {},
}) => {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [showAbove, setShowAbove] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownListRef = useRef<HTMLDivElement | null>(null);

  useOutsideClick(dropdownRef, () => setIsOpen(false));

  /**
   * Initializes the selected values based on defaultValue prop
   */
  useEffect(() => {
    try {
      if (!defaultValue || Object.keys(defaultValue).length === 0) return;

      const initialSelected: Record<string, Set<string>> = {};

      Object.entries(defaultValue).forEach(([category, options]) => {
        // Create a new Set for this category
        const optionSet = new Set<string>();

        options.forEach((option) => optionSet.add(option));

        if (options.includes("*")) {
          items[category].forEach((option) => optionSet.add(option));
        }
        // Check if all options for this category are selected
        const categoryOptions = items[category] || [];
        const allSelected =
          categoryOptions.length > 0 &&
          categoryOptions.every((opt) => options.includes(opt));

        // If all options are selected, add the "*" marker
        if (allSelected) {
          optionSet.add("*");
        }

        // Add this category's selections to the initialSelected object
        initialSelected[category] = optionSet;
      });

      // Update the selected state with the initialized values
      setSelected(initialSelected);
    } catch (error) {
      console.error(
        "MultiLevelHoverDropdown.initializeDefaultValues Error:",
        error,
      );
    }
  }, [items]);

  useEffect(() => {
    const options: any = {};
    Object.entries(selected).map(([cat, opts]) => {
      const optsArray = Array.from(opts);
      if (includes(optsArray, "*")) {
        options[cat] = ["*"];
      } else {
        options[cat] = optsArray.filter((n: string) => n !== "*");
      }
    });

    onSelect(options);
  }, [selected]);

  /**
   * Toggles the selection state of an option within a category
   * @param category The category of the option
   * @param option The option to toggle
   */
  const handleToggle = (category: string, option: string): void => {
    try {
      setSelected((prev) => {
        const current = prev[category] || new Set<string>();
        const newSet = new Set(current);
        const categoryOptions = items[category] || [];

        if (newSet.has(option)) {
          // Remove the option
          newSet.delete(option);
          // Also remove the "*" marker since not all items are selected anymore
          newSet.delete("*");
        } else {
          // Add the option
          newSet.add(option);

          // Check if all individual options are now selected
          const allSelected = categoryOptions.every(
            (opt) => opt === option || newSet.has(opt),
          );

          // If all items are now selected, add the "*" marker
          if (allSelected) {
            newSet.add("*");
          }
        }

        return {
          ...prev,
          [category]: newSet,
        };
      });
    } catch (error) {
      console.error("MultiLevelHoverDropdown.handleToggle Error:", error);
    }
  };

  /**
   * Handles the clear selection action
   */
  const handleClearSelection = (): void => {
    setSelected({});
  };

  /**
   * Checks if an option is selected within a category
   * @param category The category to check
   * @param option The option to check
   * @returns True if the option is selected, false otherwise
   */
  const isChecked = (category: string, option: string): boolean => {
    return selected[category]?.has(option) || false;
  };

  /**
   * Toggles selection of all options within a category
   * @param category The category to toggle all options for
   */
  const toggleAll = (category: string): void => {
    try {
      const categoryOptions = items[category] || [];

      // Check if all options are currently selected
      const allSelected = isAllChecked(category);

      setSelected((prev) => {
        if (allSelected) {
          // If all are selected, clear the selection
          const newSelected = { ...prev };
          newSelected[category] = new Set<string>();

          return newSelected;
        } else {
          // Otherwise select all options and add a special "*" marker
          const newSet = new Set<string>(categoryOptions);
          newSet.add("*"); // Special marker to indicate all selected

          return {
            ...prev,
            [category]: newSet,
          };
        }
      });
    } catch (error) {
      console.error("MultiLevelHoverDropdown.toggleAll Error:", error);
    }
  };

  /**
   * Checks if all options in a category are selected
   * @param category The category to check
   * @returns True if all options are selected, false otherwise
   */
  const isAllChecked = (category: string): boolean => {
    try {
      const currentSelected = selected[category] || new Set<string>();

      // Quick check for the special "*" marker
      if (currentSelected.has("*")) {
        return true;
      }

      // Otherwise check if all category options are individually selected
      const categoryOptions = items[category] || [];
      return (
        categoryOptions.length > 0 &&
        categoryOptions.every((option) => currentSelected.has(option))
      );
    } catch (error) {
      console.error("MultiLevelHoverDropdown.isAllChecked Error:", error);
      return false;
    }
  };
  /**
   * Check if there's enough space below the dropdown button
   * If not, position the dropdown above the button
   */
  const checkPosition = (): void => {
    try {
      if (!dropdownRef.current || !dropdownListRef.current) return;

      const buttonRect = dropdownRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownListRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;

      // Show above if there's not enough space below and more space above
      setShowAbove(
        spaceBelow < dropdownHeight && buttonRect.top > dropdownHeight,
      );

      // Log position calculations for debugging
      console.log("dropdown position calculations =>", {
        spaceBelow,
        dropdownHeight,
        buttonTop: buttonRect.top,
        showAbove:
          spaceBelow < dropdownHeight && buttonRect.top > dropdownHeight,
      });
    } catch (error) {
      console.error("MultiLevelDropdown.checkPosition Error:", error);
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

  /**
   * Converts selected items from Record<string, Set<string>> to a formatted string
   * @returns Formatted string of selected items or default text
   */
  const selectedItems = (): string => {
    if (isEmpty(selected)) return "All Types";

    let selectedOption = "";

    Object.entries(selected).map(([cat, opts]) => {
      const filteredOpts = Array.from(opts).filter((n: string) => n !== "*");
      selectedOption += filteredOpts.join(", ");
    });

    return selectedOption;
  };

  const renderSelectedItems = () => {
    const selectedOptions = Object.entries(selected);
    if (size(selectedOptions) < 0) return false;
    return (
      <div className="w-96">
        {Object.entries(selected).map(([cat, opts]) => {
          return (
            <div key={cat}>
              <span className="font-medium">{cat}</span>
              <span className="ml-1">
                {Array.from(opts)
                  .filter((n: string) => n !== "*")
                  .join(", ")}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={dropdownRef}
      className={`inline-block overflow-hidden relative w-max text-left rounded-lg min-w-[200px] ${className}`}
    >
      <div className="">
        {/* <Tooltip
          content={renderSelectedItems() ? renderSelectedItems() : false}
        >
         
        </Tooltip> */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          // className="flex justify-between items-center p-2 w-full bg-white rounded-lg border shadow-sm"
          // className="bg-white select-none w-full h-full flex items-center gap-x-2.5 justify-between rounded-lg border border-tertiary-50 pr-2 pl-4 sm:text-base font-medium text-tertiary-800 focus:outline-none disabled:bg-tertiary-50 py-1 px-2 sm:py-2 text-xs"
          // className={`select-none w-full h-full flex items-center gap-x-2.5 justify-between rounded-lg border border-tertiary-50 pr-2 pl-4 sm:text-base font-medium text-tertiary-800 focus:outline-none disabled:bg-tertiary-50 py-1 px-2 sm:py-2 text-xs truncate line-clamp-1 ${btnName}`}
          className={`bg-white select-none w-full h-full flex items-center gap-x-2.5 justify-between rounded-lg border border-tertiary-50 pr-2 pl-4 sm:text-base font-medium text-tertiary-800 focus:outline-none disabled:bg-tertiary-50 py-1 px-2 sm:py-2 text-xs ${btnName}`}
        >
          {preFixIcon && <img src={preFixIcon} alt="" />}
          <span className="text-left capitalize truncate line-clamp-1 max-w-40">
            {label}
          </span>
          {!hideCarat && (
            <img src={dropDownIcon} alt="dropDownIcon" className="w-5" />
          )}
        </button>
      </div>

      {isOpen && (
        <div
          ref={dropdownListRef}
          className={`fixed z-20 bg-white rounded-lg border shadow-md ${listClassName}`}
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
          {Object.entries(items).map(([category, options]) => (
            <div
              key={category}
              className="relative border-l-2 group/item hover:bg-gray-100 hover:border-l-primary-900 border-l-transparent"
            >
              <div className="flex justify-between items-center px-4 py-2 text-sm font-medium text-gray-800 cursor-pointer">
                <div className="flex gap-x-2 items-center">
                  <Checkbox
                    key={category}
                    id={category}
                    className="w-full capitalize"
                    checked={isAllChecked(category)}
                    onChange={() => toggleAll(category)}
                    label={category}
                  />
                  {size(options) > 0 && (
                    <svg
                      className="w-6 h-6 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>

              {size(options) > 0 && (
                <div className="hidden absolute top-0 left-full mt-0 ml-0 w-48 bg-white rounded-md border shadow-md group-hover/item:block">
                  {/* <div className="flex items-center px-4 py-2 text-sm text-gray-700 border-l-2 cursor-pointer hover:bg-gray-100 hover:border-l-primary-900 border-l-transparent">
                  <Checkbox
                    key={category}
                    id={category}
                    className="w-full"
                    checked={isAllChecked(category)}
                    onChange={() => toggleAll(category)}
                    label={"Select All"}
                  />
                </div>
                <Divider /> */}

                  {options.map((opt: string, index: number) => (
                    <div className="flex items-center px-4 py-2 text-sm text-gray-700 border-l-2 cursor-pointer hover:bg-gray-100 hover:border-l-primary-900 border-l-transparent">
                      <Checkbox
                        key={index}
                        id={opt}
                        className="w-full"
                        checked={isChecked(category, opt)}
                        onChange={() => handleToggle(category, opt)}
                        label={opt}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Divider />
          <div
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => handleClearSelection()}
          >
            <div className="flex justify-between items-center px-4 py-2 text-sm font-medium text-gray-800">
              Clear Selection
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiLevelHoverDropdown;
