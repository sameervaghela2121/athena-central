import { useEffect, useRef } from "react";

const useRenderCount = (): number => {
  const renderCount = useRef<number>(1); // The count starts at 1 because of the initial render

  useEffect(() => {
    renderCount.current += 1; // Increment the count after every render
  });

  return renderCount.current; // Return the current render count
};

export default useRenderCount;
