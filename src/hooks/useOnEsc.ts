import { useEffect } from "react";

const useOnEsc: any = (callback: any) => {
  useEffect(() => {
    const handleEsc = (event: any) => {
      if (event.key === "Escape" || event.keyCode === 27) {
        callback();
      }
    };

    // Add event listener for 'keydown' events
    document.addEventListener("keydown", handleEsc);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [callback]); // Re-run the effect only if the callback changes
};

export default useOnEsc;
