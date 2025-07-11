import allImgPaths from "@/assets";
import { useTranslate } from "@/hooks";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * AIBotResponseLoading component displays loading messages that change based on elapsed time
 * - Shows initial message for the first few seconds
 * - Shows extended message after a specified threshold time
 */
const AIBotResponseLoading = ({
  message,
  stage,
}: {
  message?: string;
  stage?: string;
}) => {
  const { translate } = useTranslate();
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const EXTENDED_MESSAGE_THRESHOLD = 5; // seconds

  useEffect(() => {
    // Start timer when component mounts
    const startTime = Date.now();

    // Update elapsed time every second
    const intervalId = setInterval(() => {
      try {
        const currentTime = Date.now();
        const newElapsedTime = Math.floor((currentTime - startTime) / 1000);
        setElapsedTime(newElapsedTime);
      } catch (error) {
        console.error("AIBotResponseLoading useEffect Error:", error);
      }
    }, 1000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Determine which message to show based on elapsed time
  const loadingMessage = message
    ? message
    : elapsedTime < EXTENDED_MESSAGE_THRESHOLD
      ? translate("common.aiLoadingInitial")
      : translate("common.aiLoadingExtended");

  return (
    <div className="flex gap-x-2 justify-start py-7 w-full">
      <img
        src={allImgPaths.aiAvatar}
        alt=""
        className="w-8 h-8 cursor-pointer sm:w-10 sm:h-10 shrink-0"
      />
      <div className="relative p-2 px-3 text-sm tracking-wide rounded-md chat-container sm:px-4 text-tertiary-900 aiResponseChat max-w-5/6 sm:max-w-full w-fit sm:text-base">
        <div className="flex gap-x-1 justify-between items-start">
          <div className="flex gap-x-1 items-center">
            <p className="italic loading-shimmer">{loadingMessage}</p>
            <div className="flex items-center">
              {"••••".split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.3,
                    ease: "easeInOut",
                  }}
                  className="text-lg font-bold"
                >
                  {char}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIBotResponseLoading;
