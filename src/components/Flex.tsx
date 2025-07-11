import React from "react";

interface FlexProps {
  direction?: "row" | "column"; // Flex direction (row or column)
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"; // Justify content
  align?: "start" | "center" | "end" | "stretch" | "baseline"; // Align items
  wrap?: boolean; // Whether flex items should wrap
  className?: string; // Additional custom classes
  gap?: number; // Gap between flex items (Tailwind gap-{size})
  children: React.ReactNode; // Child elements
}

const Flex: React.FC<FlexProps> = ({
  direction = "row",
  justify = "start",
  align = "stretch",
  wrap = false,
  className = "",
  gap = 0,
  children,
}) => {
  // Map props to Tailwind classes
  const directionClass = direction === "column" ? "flex-col" : "flex-row";
  const justifyClass = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  }[justify];

  const alignClass = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  }[align];

  const wrapClass = wrap ? "flex-wrap" : "flex-nowrap";
  const gapClass = gap > 0 ? `gap-${gap}` : "";

  return (
    <div
      className={`flex ${directionClass} ${justifyClass} ${alignClass} ${wrapClass} ${gapClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default React.memo(Flex);
