import allImgPaths from "@/assets";
import { CSSProperties } from "react";
import { ClearIndicatorProps } from "react-select";

const ClearIndicator = (props: ClearIndicatorProps<any, true>) => {
  const {
    getStyles,
    innerProps: { ref, ...restInnerProps },
  } = props;
  return (
    <div
      {...restInnerProps}
      ref={ref}
      style={getStyles("clearIndicator", props) as CSSProperties}
      className="cursor-pointer"
    >
      <div className="px-1 py-0 text-tertiary-700">
        <img src={allImgPaths.closeIcon} alt="closeIcon" />
      </div>
    </div>
  );
};

export default ClearIndicator;
