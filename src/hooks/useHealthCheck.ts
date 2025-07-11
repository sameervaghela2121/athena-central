import axios from "axios";
import { get, isEmpty } from "lodash-es";
import { useEffect, useState } from "react";

import { HOST } from "@/shared/constants";

/**
 * Interface for service health status
 */
interface ServiceHealth {
  name: string;
  isRunning: boolean;
  error?: string;
  buildVersion?: string;
}

/**
 * Custom hook to check the health status of all microservices
 * @returns Object containing health status information for all services
 */
export const useHealthCheck = () => {
  const [servicesHealth, setServicesHealth] = useState<ServiceHealth[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allServicesRunning, setAllServicesRunning] = useState<boolean>(false);

  /**
   * Check health of a specific service with retry mechanism
   * @param serviceName Name of the service to check
   * @param serviceUrl Base URL of the service
   * @param retryCount Number of retries to attempt (default: 3)
   * @param retryDelay Delay between retries in milliseconds (default: 700ms)
   * @param updateCallback Optional callback to update service status after background retries
   * @returns Promise with service health status
   */
  const checkServiceHealth = async (
    serviceName: string,
    serviceUrl: string,
    retryCount: number = 3,
    retryDelay: number = 700,
    updateCallback?: (service: ServiceHealth) => void,
  ): Promise<ServiceHealth> => {
    // Return early if service URL is not configured
    if (isEmpty(serviceUrl)) {
      return {
        name: serviceName,
        isRunning: false,
        error: "Service URL not configured",
      };
    }

    try {
      // First attempt - if successful, return immediately
      console.log(
        `checkServiceHealth: Checking ${serviceName} health at ${serviceUrl}/health`,
      );
      const response = await axios.get(`${serviceUrl}/health`, {
        timeout: 5000, // 5 second timeout
      });

      // Log success
      console.log(`checkServiceHealth: ${serviceName} health check successful`);

      const successResult = {
        name: serviceName,
        isRunning: response.status >= 200 && response.status < 300,
        buildVersion: get(
          response,
          "data.data.result.build_version",
          "unknown",
        ),
      };

      return successResult;
    } catch (error) {
      // First attempt failed, return failure immediately but start background retries
      console.log(
        `checkServiceHealth: Initial attempt failed for ${serviceName}, will retry in background`,
      );
      const initialFailure = {
        name: serviceName,
        isRunning: false,
        error: "Checking service availability...", // More user-friendly initial message
      };

      // Start background retries if callback is provided
      if (updateCallback) {
        // Immediately schedule the final status update to ensure it happens
        // This will be cleared if a retry succeeds or if we manually update on final failure
        const finalTimeoutId = setTimeout(
          () => {
            console.log(
              `checkServiceHealth: Forced final status update for ${serviceName}`,
            );
            updateCallback({
              name: serviceName,
              isRunning: false,
              error: "Failed to connect to service after multiple attempts",
            });
          },
          retryCount * retryDelay + 1000,
        ); // Add a buffer to the timeout

        // Start sequential retries in the background
        (async () => {
          let attempts = 1; // Already made first attempt

          // Sequential retry loop - each retry waits for the previous one to complete
          while (attempts < retryCount) {
            // Wait for the specified delay before next attempt
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            attempts++;
            try {
              console.log(
                `checkServiceHealth: Executing retry ${attempts}/${retryCount} for ${serviceName}`,
              );
              
              const response = await axios.get(
                `${serviceUrl}/health?retry=${attempts}`,
                {
                  timeout: 5000,
                },
              );

              // If retry succeeds, update via callback and exit the retry loop
              if (response.status >= 200 && response.status < 300) {
                const successResult = {
                  name: serviceName,
                  isRunning: true,
                  buildVersion: get(
                    response,
                    "data.data.result.build_version",
                    "unknown",
                  ),
                };
                console.log(
                  `checkServiceHealth: Retry ${attempts} succeeded for ${serviceName}`,
                );
                clearTimeout(finalTimeoutId); // Clear the timeout as we succeeded
                updateCallback(successResult);
                return; // Exit retry loop on success
              }
            } catch (retryError) {
              // If this is the final retry attempt, update with final failure status
              if (attempts === retryCount) {
                console.error("checkServiceHealth Error:", retryError);
                const finalError = {
                  name: serviceName,
                  isRunning: false,
                  error: "Failed to connect to service after multiple attempts",
                };
                console.log(
                  `checkServiceHealth: All retries failed for ${serviceName}, updating with final status`,
                );
                clearTimeout(finalTimeoutId); // Clear the timeout as we're manually updating
                updateCallback(finalError);
              } else {
                console.log(
                  `checkServiceHealth: Retry ${attempts} failed for ${serviceName}, will try again`,
                );
              }
            }
          }
        })().catch(error => {
          // Catch any errors in the retry process itself
          console.error("checkServiceHealth Sequential Retry Error:", error);
          clearTimeout(finalTimeoutId);
          updateCallback({
            name: serviceName,
            isRunning: false,
            error: "Failed to connect to service after multiple attempts",
          });
        });
      }

      return initialFailure;
    }
  };

  /**
   * Update a specific service's health status in the state
   * @param updatedService The updated service health information
   */
  const updateServiceStatus = (updatedService: ServiceHealth) => {
    console.log(
      `updateServiceStatus: Updating ${updatedService.name} status to ${updatedService.isRunning ? "running" : "not running"} with message: ${updatedService.error || "no error"}`,
    );

    setServicesHealth((prevServices) => {
      const newServices = [...prevServices];
      const index = newServices.findIndex(
        (service) => service.name === updatedService.name,
      );

      if (index !== -1) {
        newServices[index] = updatedService;

        // Also update allServicesRunning state
        setAllServicesRunning(
          newServices.every((service) => service.isRunning),
        );
        return newServices;
      } else {
        console.error(
          `updateServiceStatus Error: Could not find service ${updatedService.name} in the current state`,
        );
      }

      return prevServices;
    });
  };

  /**
   * Check health of all services
   */
  const checkAllServices = async () => {
    setIsLoading(true);
    try {
      // Define all services to check
      const servicesToCheck = [
        { name: "AUTH", url: `${HOST.AUTH}/auth` },
        { name: "USERS", url: `${HOST.USERS}/users` },
        {
          name: "KNOWLEDGE_ENTRIES",
          url: `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries`,
        },
        { name: "QUESTIONS", url: `${HOST.QUESTIONS}/questions` },
        { name: "QUEUES", url: `${HOST.QUEUES}/queues` },
        { name: "CHAT", url: `${HOST.CHAT}/chat` },
        { name: "CONVERSATIONS", url: `${HOST.CONVERSATIONS}/conversations` },
        {
          name: "CONVERSATION_MESSAGES",
          url: `${HOST.CONVERSATION_MESSAGES}/conversation-messages`,
        },
        { name: "DASHBOARD", url: `${HOST.DASHBOARD}/dashboard` },
        {
          name: "CELERY_WORKER",
          url: `${HOST.CELERY_WORKER_AS_SERVICE}/celery_tasks`,
        },
        {
          name: "DOCUMENT_PROCESSING",
          url: `${HOST.KNOWLEDGE_ENTRIES}/document-entries`,
        },
      ];

      // Initialize services health array with pending status for all services
      const initialServiceHealth = servicesToCheck.map((service) => ({
        name: service.name,
        isRunning: false,
        error: "Checking service availability...",
      }));

      // Set initial state
      setServicesHealth(initialServiceHealth);

      // Create service health check promises with updateCallback for background retries
      const servicePromises = servicesToCheck.map((service) =>
        checkServiceHealth(
          service.name,
          service.url,
          3, // retryCount
          700, // retryDelay
          updateServiceStatus,
        ),
      );

      // Get initial results (immediate success or first-attempt failure)
      const results = await Promise.allSettled(servicePromises);

      // Process the initial results from Promise.allSettled
      const serviceChecks = results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          // If the promise was rejected, create a failed service health object
          const serviceName = servicesToCheck[index].name;
          console.error("checkAllServices Error:", result.reason);

          // Return a temporary failure status - the background retries will update this
          return {
            name: serviceName,
            isRunning: false,
            error: "Checking service availability...", // This will be updated by the background retries
          };
        }
      });

      // Update state with initial results
      setServicesHealth(serviceChecks);
      setAllServicesRunning(
        serviceChecks.every((service) => service.isRunning),
      );

      // Ensure that after a certain timeout, any services still showing "Checking" get updated
      // This is a final fallback in case something goes wrong with the retry mechanism
      setTimeout(() => {
        setServicesHealth((prevServices) => {
          const updatedServices = [...prevServices];
          let needsUpdate = false;

          updatedServices.forEach((service, index) => {
            if (service.error === "Checking service availability...") {
              console.log(
                `Final fallback: Service ${service.name} still showing 'Checking' status after timeout`,
              );
              updatedServices[index] = {
                ...service,
                error: "Failed to connect to service after multiple attempts",
              };
              needsUpdate = true;
            }
          });

          return needsUpdate ? updatedServices : prevServices;
        });
      }, 3000); // 3 seconds should be enough for all retries to complete
    } catch (error) {
      console.error("checkAllServices Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAllServices();
  }, []);

  /**
   * Retry health check for a specific service
   * @param serviceName Name of the service to retry
   */
  const retryServiceHealthCheck = async (serviceName: string) => {
    try {
      // Find the service in the current state
      const serviceToRetry = servicesHealth.find(service => service.name === serviceName);
      
      if (!serviceToRetry) {
        console.error(`retryServiceHealthCheck Error: Service ${serviceName} not found`);
        return;
      }
      
      // Find the service URL from the configuration
      const serviceConfig = [
        { name: "AUTH", url: `${HOST.AUTH}/auth` },
        { name: "USERS", url: `${HOST.USERS}/users` },
        { name: "KNOWLEDGE_ENTRIES", url: `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries` },
        { name: "QUESTIONS", url: `${HOST.QUESTIONS}/questions` },
        { name: "QUEUES", url: `${HOST.QUEUES}/queues` },
        { name: "CHAT", url: `${HOST.CHAT}/chat` },
        { name: "CONVERSATIONS", url: `${HOST.CONVERSATIONS}/conversations` },
        { name: "CONVERSATION_MESSAGES", url: `${HOST.CONVERSATION_MESSAGES}/conversation-messages` },
        { name: "DASHBOARD", url: `${HOST.DASHBOARD}/dashboard` },
        { name: "CELERY_WORKER", url: `${HOST.CELERY_WORKER_AS_SERVICE}/celery_tasks` },
        { name: "DOCUMENT_PROCESSING", url: `${HOST.KNOWLEDGE_ENTRIES}/document-entries` },
      ].find(config => config.name === serviceName);
      
      if (!serviceConfig) {
        console.error(`retryServiceHealthCheck Error: Configuration for ${serviceName} not found`);
        return;
      }
      
      // Update the service status to "Checking"
      updateServiceStatus({
        name: serviceName,
        isRunning: false,
        error: "Checking service availability..."
      });
      
      // Perform the health check
      const result = await checkServiceHealth(
        serviceConfig.name,
        serviceConfig.url,
        3, // retryCount
        700, // retryDelay
        updateServiceStatus
      );
      
      console.log(`retryServiceHealthCheck: Initial check for ${serviceName} completed with status: ${result.isRunning ? "running" : "not running"}`);
    } catch (error) {
      console.error("retryServiceHealthCheck Error:", error);
    }
  };

  return {
    servicesHealth,
    isLoading,
    allServicesRunning,
    refreshStatus: checkAllServices,
    retryServiceHealthCheck,
  };
};
