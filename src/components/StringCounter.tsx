import { AnimatePresence, motion } from "framer-motion";
import { size } from "lodash-es";
import { memo } from "react";

const StringCounter = ({
  limit: maxChar = 0,
  value = "",
  className = "",
}: {
  limit: number;
  className?: string;
  value: string | null | undefined;
}) => {
  const charCount = size(value); // Calculate the current character count
  const isNearLimit = charCount >= 0.8 * maxChar && charCount <= maxChar; // Check if near the limit
  const isOverLimit = charCount > maxChar; // Check if over the limit

  return (
    <>
      {maxChar > 0 && size(value) > 0 && (
        <div className={`absolute right-4 bottom-4 ${className}`}>
          <div className="flex items-center text-tertiary-700">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={size(value) ? size(value) : "empty"}
                initial={{
                  y: -10,
                  opacity: 0,
                }}
                animate={{ y: 0, opacity: 1 }}
                exit={{
                  y: 10,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.1,
                  ease: "backOut",
                }}
              >
                <div
                  className={`p-1 ${
                    isOverLimit
                      ? "text-status-error font-semibold" // Red if over the limit
                      : isNearLimit
                        ? "text-yellow-500 font-medium" // Yellow if near the limit
                        : ""
                  }`}
                >
                  {charCount}
                </div>
              </motion.div>
            </AnimatePresence>
            /{maxChar}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(StringCounter);
