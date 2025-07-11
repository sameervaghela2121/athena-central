import { useEffect, useRef } from "react";

/**
 * The function `useIsFirstRender` returns a boolean value indicating whether the component is being
 * rendered for the first time.
 * @returns The function `useIsFirstRender` returns the value of `is_first_render.current`, which
 * indicates whether the component is being rendered for the first time or not.
 */
const useIsFirstRender = () => {
  const is_first_render = useRef(true);

  useEffect(() => {
    is_first_render.current = false;
  }, []);

  return is_first_render.current;
};

export default useIsFirstRender;
