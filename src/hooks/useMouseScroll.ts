import { useEffect, useState } from "react";

const useMouseScroll = (element: HTMLElement | Window = window) => {
  const [scrollDelta, setScrollDelta] = useState({
    deltaX: 0,
    deltaY: 0,
  });

  useEffect(() => {
    const target = element === window ? window : element;

    const handleWheel: any = (event: WheelEvent) => {
      setScrollDelta({
        deltaX: event.deltaX, // Horizontal scroll delta
        deltaY: event.deltaY, // Vertical scroll delta
      });
    };

    // Attach the wheel event listener
    target.addEventListener("wheel", handleWheel);

    // Cleanup the event listener on unmount
    return () => {
      target.removeEventListener("wheel", handleWheel);
    };
  }, [element]);

  return scrollDelta;
};

export default useMouseScroll;
