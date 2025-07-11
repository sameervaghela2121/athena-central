import React from "react";
import allImgPaths from "../assets/index";

type SearchInputProps = {
  value: string;
  onChange: (e: string) => void;
  onClick?: () => void;
  placeholder?: string;
  className?: string;
};

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClick = () => {},
  placeholder = "Search...",
  className = "",
}) => {
  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2 pl-11 pr-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none placeholder:text-base placeholder:text-tertiary-400 placeholder:font-medium text-base text-tertiary-900"
      />
      <img
        src={allImgPaths.searchLight}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
      />
      <div
        className="absolute right-4 top-1/2 transform -translate-y-1/2 h-3 w-3 cursor-pointer"
        title="Clear"
        onClick={() => onChange("")}
      >
        {value && <img src={allImgPaths.closeIcon} />}
      </div>
    </div>
  );
};

export default SearchInput;
