import useMouseScroll from "@/hooks/useMouseScroll";
import useOutsideClick from "@/hooks/useOutSideClick";
import useWindowSize from "@/hooks/useWindowSize";
import React, { memo, ReactNode, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { AnimatedContainerBase } from "./AnimatedContainerBase";

interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  classes?: string;
  quick?: boolean;
  position?: "top" | "right" | "bottom" | "left";
  onHoverOpen?: boolean;
}

const Popover: React.FC<PopoverProps> = ({
  trigger,
  quick = true,
  content,
  position = "top",
  classes = "",
  onHoverOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({}); // To store dropdown position
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLDivElement | null>(null);

  const size = useWindowSize();
  const useScroll = useMouseScroll();

  useOutsideClick(popoverRef, () => setIsOpen(false), btnRef);

  const togglePopover = () => setIsOpen(!isOpen);

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    right: "top-1/2 left-full transform -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "top-1/2 right-full transform -translate-y-1/2 mr-2",
  };

  useEffect(() => {
    if (isOpen && btnRef.current && popoverRef.current) {
      const buttonRect = btnRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0,
        left = 0;
      let adjustedPosition = position;

      // Adjust position based on overflow
      if (position === "top" && buttonRect.top - popoverRect.height < 0) {
        adjustedPosition = "bottom";
      } else if (
        position === "bottom" &&
        buttonRect.bottom + popoverRect.height > viewportHeight
      ) {
        adjustedPosition = "top";
      } else if (
        position === "left" &&
        buttonRect.left - popoverRect.width < 0
      ) {
        adjustedPosition = "right";
      } else if (
        position === "right" &&
        buttonRect.right + popoverRect.width > viewportWidth
      ) {
        adjustedPosition = "left";
      }

      // Calculate new position after adjustment
      switch (adjustedPosition) {
        case "top":
          top = buttonRect.top - popoverRect.height;
          left = buttonRect.left + buttonRect.width / 2 - popoverRect.width / 2;
          break;
        case "bottom":
          top = buttonRect.bottom;
          left = buttonRect.left + buttonRect.width / 2 - popoverRect.width / 2;
          break;
        case "left":
          top = buttonRect.top + buttonRect.height / 2 - popoverRect.height / 2;
          left = buttonRect.left - popoverRect.width;
          break;
        case "right":
          top = buttonRect.top + buttonRect.height / 2 - popoverRect.height / 2;
          left = buttonRect.right;
          break;
      }

      setPopoverPosition({ top, left });
    }
  }, [isOpen, position]);

  // Calculate the dropdown position based on the button
  useEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();

      setPopoverPosition({
        top: rect.bottom + window.scrollY, // Set the dropdown below the button
        left: rect.left - 130,
      });
    }
  }, [isOpen, size, useScroll]);

  return (
    <div className="inline-block relative">
      <div
        onClick={togglePopover}
        onMouseEnter={onHoverOpen ? togglePopover : undefined}
        onMouseLeave={onHoverOpen ? togglePopover : undefined}
        className="cursor-pointer"
        ref={btnRef}
      >
        {trigger}
      </div>
      {isOpen &&
        ReactDOM.createPortal(
          <AnimatedContainerBase key={isOpen} quick={quick}>
            <div
              ref={popoverRef}
              style={{
                top: popoverPosition?.top,
                left: popoverPosition?.left,
                position: "absolute",
                height: "fit-content",
              }}
              onClick={() => setIsOpen(false)} // Close popover on content click
              className={`absolute z-40 p-4 w-max bg-white rounded-2xl border border-gray-300 shadow-lg ${classes} ${positionClasses[position]}`}
            >
              {content}
            </div>
          </AnimatedContainerBase>,
          document.body, // Render popover into the body element
        )}
    </div>
  );
};

export default memo(Popover);
