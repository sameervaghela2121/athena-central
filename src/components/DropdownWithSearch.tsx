import allImgPaths from "@/assets/index";
import useIsFirstRender from "@/hooks/useIsFirstRender";
import useOutsideClick from "@/hooks/useOutSideClick";
import { classes } from "@/shared/functions";
import { Option } from "@/shared/types";
import { map, size, startCase, toLower } from "lodash-es";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { tv } from "tailwind-variants";
import Checkbox from "./Checkbox";
import SearchInput from "./SearchInput";

interface DropdownProps {
  options: Option[];
  value: (string | number)[];
  placeholder?: string;
  onSelect: (selectedOptions: Option[]) => void;
  tooltip?: boolean;
  showChips?: boolean;
  containerClasses?: string;
  dropdownContainerClasses?: string;
  type?: "primary" | "secondary";
  label?: string;
  isMulti?: boolean;
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
  base: "flex cursor-pointer gap-2 hover:bg-gray-100 px-4 py-2 border-l border-l-transparent relative",
  variants: {
    active: {
      true: "selected-menu font-semibold text-[rgb(0_51_102_/_var(--tw-bg-opacity))] border-solid",
    },
  },
});

const listContainer = tv({
  base: "absolute z-10 mt-1 left-0 w-full rounded bg-white shadow-[0px_2px_12px_3px_#0A0A381A] max-h-96 h-auto transition-all duration-200 transform origin-top overflow-auto scrollbar-thin",
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
    <div className="flex gap-2 flex-wrap select-none">
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
            className="cursor-pointer w-[10px] h-[10px] transition-transform duration-200 hover:scale-110"
            alt="close"
            onClick={() => handleRemove(value)}
          />
        </div>
      ))}
    </div>
  );
};

const DropdownWithSearch: React.FC<DropdownProps> = ({
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
  isMulti = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
  const [search, setSearch] = useState("");

  const isFirstRender = useIsFirstRender();

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const typeClasses = type === "secondary" ? "bg-gray" : "";

  const handleToggle = () => setIsOpen(!isOpen);

  useOutsideClick(dropdownRef, () => setIsOpen(false), buttonRef); // Hide dropdown on outside click

  useEffect(() => {
    if (!isFirstRender) onSelect(selectedOptions);
  }, [selectedOptions]);

  // Function to check if an option is selected
  const isSelected = (value: number | string) => {
    return selectedOptions.some((option) => option.value === value);
  };

  const handleSelect = (option: Option) => {
    if (isMulti) {
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
    } else {
      setSelectedOptions([option]);
    }
  };

  const handleRemove = (value: string | number) => {
    setSelectedOptions((prevSelected) =>
      prevSelected.filter((option) => option.value !== value),
    );
  };

  const names = useMemo(() => {
    return map(selectedOptions, "label").join(", ");
  }, [selectedOptions]);

  const filterOptions = useMemo(() => {
    if (search) {
      return options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      );
    } else {
      return options;
    }
  }, [search, options]);

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="select-none">{label}</span>}
      <div
        className={classes(
          "relative rounded inline-block w-full cursor-pointer",
          containerClasses,
          typeClasses,
        )}
      >
        <SearchInput
          onChange={setSearch}
          value={search}
          placeholder={names || placeholder}
          onClick={handleToggle}
          className={button({
            type: type,
          })}
        />

        <div
          ref={dropdownRef}
          className={listContainer({
            active: isOpen,
            class: dropdownContainerClasses,
          })}
        >
          <ul className="rounded-md select-none divide-y max-h-[300px] overflow-y-auto">
            {size(filterOptions) > 0 ? (
              filterOptions.map(({ label, value }, index) => (
                <li
                  title={tooltip ? label : ""}
                  key={index}
                  className={list({
                    active: selectedOptions.some(
                      (option) => option.value === value,
                    ),
                  })}
                  onClick={() => handleSelect({ label, value })}
                >
                  <Checkbox
                    checked={selectedOptions.some(
                      (option) => option.value === value,
                    )}
                    onChange={() => {}}
                  />
                  <div className="truncate w-full">
                    <span>{startCase(toLower(label))}</span>
                  </div>
                </li>
              ))
            ) : (
              <li className={list()}>
                <div className="truncate p-1">
                  <span>No result found</span>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
      {showChips && (
        <RenderChips
          handleRemove={handleRemove}
          selectedOptions={selectedOptions}
        />
      )}
    </div>
  );
};

export default React.memo(DropdownWithSearch);
