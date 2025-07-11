import { useCallback, useEffect, useRef } from "react";

interface UseIdleTimerProps {
  timeout: number; // Time in milliseconds before considering the user idle
  onIdle: () => void; // Callback function to invoke when idle
}

const useIdleTimer = ({ timeout, onIdle }: UseIdleTimerProps) => {
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    // Clear the existing timer if it exists
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    // Set a new timer for the specified timeout
    idleTimeoutRef.current = setTimeout(() => {
      onIdle(); // Call the provided callback when the user becomes idle
    }, timeout);
  }, [timeout, onIdle]);

  useEffect(() => {
    // List of events that reset the idle timer on user interaction
    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
    ];

    // Attach event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Set the initial idle timeout
    resetIdleTimer();

    // Cleanup event listeners and timeout when component unmounts
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [resetIdleTimer]);

  return resetIdleTimer; // Return the function to manually reset the timer if needed
};

export default useIdleTimer;
