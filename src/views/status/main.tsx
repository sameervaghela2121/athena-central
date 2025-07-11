import allImgPaths from "@/assets";
import { LoaderCircle } from "@/components";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import { motion } from "framer-motion";
import { capitalize, startCase } from "lodash-es";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Status component displays the health status of all services
 * Shows a clean UI with service names and their running status
 */
const Status = () => {
  const {
    servicesHealth,
    isLoading,
    allServicesRunning,
    refreshStatus,
    retryServiceHealthCheck,
  } = useHealthCheck();
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString(),
  );

  const [initialLoad, setInitialLoad] = useState(true);

  // Add this state to track when animations should play
  const [shouldAnimate, setShouldAnimate] = useState(true);

  const SERVICES_ICONS: Record<string, string> = {
    AUTH: "🔒",
    USERS: "👥",
    KNOWLEDGE_ENTRIES: "📚",
    QUESTIONS: "🔍",
    QUEUES: "📥",
    CHAT: "💬",
    CONVERSATIONS: "🗨️",
    CONVERSATION_MESSAGES: "📨",
    DASHBOARD: "📊",
    CELERY_WORKER: "⚙️",
    DOCUMENT_PROCESSING: "📄",
  };

  // In your useEffect where you handle the initial load
  useEffect(() => {
    if (!isLoading && servicesHealth.length > 0 && initialLoad) {
      setInitialLoad(false);
      // Set shouldAnimate to false after the initial animation
      setTimeout(() => setShouldAnimate(false), 2000); // Wait for animations to complete
    }
  }, [isLoading, servicesHealth, initialLoad]);

  // Set initialLoad to false after first data load
  useEffect(() => {
    if (!isLoading && servicesHealth.length > 0 && initialLoad) {
      setInitialLoad(false);
    }
  }, [isLoading, servicesHealth, initialLoad]);

  // Update the time display when services are checked
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };

    // Set interval for time updates
    const intervalId = setInterval(updateTime, 10000);
    return () => clearInterval(intervalId);
  }, []);

  /**
   * Renders the status indicator icon based on service running state
   * @param isRunning - Boolean indicating if service is running
   */
  const renderStatusIcon = (isRunning: boolean) => {
    return isRunning ? (
      <div className="flex justify-center items-center w-6 h-6 bg-green-100 rounded-full">
        <img
          src={allImgPaths.circleCheck}
          alt="Check Circle"
          className="w-4 h-4 text-green-500"
        />
      </div>
    ) : (
      <div className="flex justify-center items-center w-6 h-6 bg-red-100 rounded-full">
        <img
          src={allImgPaths.rejectCheckIcon}
          alt="Cross Circle"
          className="w-4 h-4 text-red-500"
        />
      </div>
    );
  };

  /**
   * Renders a service card with status information
   * @param serviceName - Name of the service
   * @param isRunning - Boolean indicating if service is running
   * @param lastChecked - Time when service was last checked
   */
  /**
   * Handles retrying a specific service health check
   * @param serviceName - Name of the service to retry
   */
  const handleRetryService = (serviceName: string) => {
    retryServiceHealthCheck(serviceName);
  };

  /**
   * Handles refreshing all services health checks
   */
  const handleRefreshAll = () => {
    toast.info("Refreshing all services...");
    refreshStatus();
  };

  /**
   * Renders a service card with status information and retry button
   * @param serviceName - Name of the service
   * @param isRunning - Boolean indicating if service is running
   * @param lastChecked - Time when service was last checked
   * @param error - Optional error message
   * @param buildVersion - Optional build version
   */
  const renderServiceCard = (
    serviceName: string,
    isRunning: boolean,
    lastChecked: string,
    error?: string,
    buildVersion?: string,
  ) => {
    /**
     * Copies text to clipboard
     * @param text - Text to copy
     */
    const copyToClipboard = (text: string) => {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          toast.success("Build version copied to clipboard", { id: 1 });
        })
        .catch((err) => {
          console.error("copyToClipboard Error:", err);
        });
    };

    // Check if service is currently being checked
    const isChecking = error === "Checking service availability...";

    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className={`flex justify-between items-center`}>
          <div className="flex items-center space-x-3">
            <div className="flex justify-center items-center p-5 w-6 h-6 rounded-lg bg-tertiary-50/50">
              <span className="">{SERVICES_ICONS[serviceName]}</span>
            </div>
            <span className="font-medium">
              {capitalize(startCase(serviceName))}
              {buildVersion && (
                <p
                  className="text-xs text-gray-500 cursor-pointer"
                  onClick={() => copyToClipboard(buildVersion)}
                >
                  {buildVersion}
                </p>
              )}
            </span>
          </div>
          <div className="flex items-center">
            <div
              className={`gap-x-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isRunning ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              <span
                className={`w-1 h-1 animate-ping rounded-full ${isRunning ? "bg-green-500" : "bg-red-500"}`}
              />
              <span> {isRunning ? "Running" : "Offline"}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          {error && <p className="flex-1 text-xs text-red-500">{error}</p>}
          <button
            type="button"
            className="px-2 py-1 ml-auto text-xs rounded-full border border-gray-200"
            onClick={() => handleRetryService(serviceName)}
            disabled={isChecking}
          >
            <img
              src={allImgPaths.refresh}
              alt="Retry"
              className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>
    );
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl">
      {/* Header Section */}
      <div className="flex flex-col gap-x-2 items-center mb-6">
        <div className="flex gap-x-2 items-center">
          <img
            src={allImgPaths.systemStatus}
            alt="System Status"
            className="w-5 h-5"
          />
          <h1 className="text-2xl font-bold">System Status</h1>
        </div>
        <p className="text-sm text-gray-600">
          Real-time monitor for service availability
        </p>
      </div>

      {/* System Status Overview Card */}
      <div className="p-6 mb-8 bg-white rounded-lg border border-gray-200">
        {isLoading && initialLoad ? (
          <div className="flex flex-col justify-center items-center py-8">
            <div className="mb-4">
              <LoaderCircle text="Checking system status..." />
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center py-6">
            <div
              className={`p-4 flex justify-center items-center mb-4 w-20 h-20 ${allServicesRunning ? "bg-green-50 border-green-300" : "bg-[#f87171]/10  border-red-300"} rounded-full`}
            >
              {allServicesRunning ? (
                <img
                  src={allImgPaths.successIcon}
                  alt="Success"
                  className="w-8 h-8"
                />
              ) : (
                <img
                  src={allImgPaths.crossRed}
                  alt="Error"
                  className="w-8 h-8"
                />
              )}
            </div>
            <h3 className="mb-1 text-xl font-medium text-center">
              {allServicesRunning
                ? "All Systems Operational"
                : "Some Systems Are Down"}
            </h3>
            <p className="mb-4 text-center text-gray-600">
              {allServicesRunning
                ? "All services are running normally."
                : "Some services are experiencing issues."}
            </p>
            {/* <Button
              type="button"
              variant="outlined"
              onClick={handleRefreshAll}
              className="!p-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="mr-2 w-4 h-4 rounded-full border-2 animate-spin border-t-transparent border-primary"></span>
                  Refreshing...
                </span>
              ) : (
                "Refresh All Services"
              )}
            </Button> */}
          </div>
        )}
      </div>

      {/* Services Grid with Animation */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2">
          {servicesHealth.map((service, index) => {
            return (
              <motion.div
                key={service.name}
                initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: shouldAnimate ? index * 0.15 : 0,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                {renderServiceCard(
                  service.name,
                  service.isRunning,
                  currentTime,
                  service.error,
                  service.buildVersion,
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-sm text-center text-gray-500">
        {currentYear} System Status Dashboard. All rights reserved.
      </div>
    </div>
  );
};

export default Status;
