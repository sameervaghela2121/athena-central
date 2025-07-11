import { useTranslate } from "@/hooks";
import en from "@/i18n/translations/en.json";
import { FILE_ICONS } from "@/shared/constants";
import classNames from "classnames";
import { isEmpty } from "lodash-es";
import React from "react";

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKey = NestedKeyOf<typeof en>;
type SourceType =
  | "pdf"
  | "txt"
  | "png"
  | "mp4"
  | "html"
  | "jpeg"
  | "jpg"
  | "doc"
  | "docx"
  | "default"
  | "mp4"
  | "mkv"
  | "mov"
  | "webm"
  | "avi";

/**
 * Props for the SourceButton component
 */
interface SourceButtonProps {
  /** Label text to display on the button (fallback if translationKey not provided) */
  label?: string;
  /** Optional CSS class name */
  className?: string;
  /** Array of source types to display as badges */
  sourceTypes?: Array<SourceType>;
  /** Count of sources (if needed) */
  count?: number;
  /** Whether to show the count badge */
  showCount?: boolean;
  /** Click handler */
  onClick?: (e: React.MouseEvent) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Translation key for button text */
  translationKey?: TranslationKey;
}

/**
 * A button component that displays source information with icon badges
 * @param props - Component props
 * @returns SourceButton component
 */
const SourceButton: React.FC<SourceButtonProps> = ({
  label,
  className = "",
  sourceTypes = [],
  count,
  showCount = false,
  onClick,
  disabled = false,
  translationKey = "common.sources" as TranslationKey,
}) => {
  const { translate } = useTranslate();

  // Use translation key if provided, otherwise use label
  const buttonText = !isEmpty(label) ? label : translate(translationKey);
  /**
   * Map of source types to their respective icon paths
   */

  /**
   * Renders the source type badges
   * @returns JSX element with source badges
   */

  const renderSourceTypeBadges = () => (
    <div className="flex mr-2 -space-x-2">
      {sourceTypes.slice(0, 3).map((type, index) => (
        <div
          key={`${type}-${index}`}
          className={classNames(
            "w-7 h-7 rounded-full flex items-center justify-center bg-blue-50 border-2 border-white",
            { "z-6": index === 0 },
            { "z-4": index === 1 },
            { "z-2": index === 2 },
          )}
        >
          <img src={FILE_ICONS[type]} className="w-4 h-4" />
        </div>
      ))}
    </div>
  );

  return (
    <button
      className={classNames(
        "flex items-center px-2 py-0.5 rounded-lg border border-[#D9F0F9] hover:bg-[#D9F0F9]  transition-all duration-300 text-sm font-medium text-gray-700",
        { "opacity-50 cursor-not-allowed": disabled },
        className,
      )}
      onClick={(e) => {
        if (!disabled && onClick) onClick(e);
      }}
      disabled={disabled}
      type="button"
      aria-label={buttonText}
    >
      {sourceTypes.length > 0 && renderSourceTypeBadges()}
      <span>{buttonText}</span>
      {showCount && count !== undefined && count > 0 && (
        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
};

export default React.memo(SourceButton);
