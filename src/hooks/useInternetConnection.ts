import { useEffect, useState } from "react";

function useInternetConnection() {
  // State to store the online/offline status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Effect to set up event listeners for online and offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Add event listeners for 'online' and 'offline' status changes
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export default useInternetConnection;
