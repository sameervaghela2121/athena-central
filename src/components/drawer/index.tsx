import { AnimatePresence, motion } from "framer-motion";
import React, { memo, useEffect, useMemo } from "react";

import { useWindowSize } from "@/hooks";
import useOnEsc from "@/hooks/useOnEsc";
import { AnimatedContainerBase } from "../AnimatedContainerBase";
import DrawerHeader from "./Header";

interface DrawerProps {
  id?: string;
  show: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  icon?: string;
  backDrop?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  title?: React.ReactNode | boolean;
  position?: "left" | "right";
}

/**
 * Drawer component that slides in from either the left or right side
 */
const Drawer: React.FC<DrawerProps> = ({
  id,
  show,
  onClose,
  title = false,
  size = "md",
  children,
  backDrop = false,
  position = "right",
}) => {
  const { width } = useWindowSize();
  if (backDrop) {
    useOnEsc(onClose);
  }

  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.body.clientWidth + "px"; // Counting scrollbar width

    if (show) {
      // Prevent scrolling on the body when drawer is open
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = scrollbarWidth; // Add padding same as scrollbar width to prevent screen flicker
    } else {
      // Re-enable scrolling on the body when drawer is closed
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding");
    }

    // Clean up on unmount
    return () => {
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding");
    };
  }, [show]);

  const drawerWidth = useMemo(() => {
    if (width < 768) {
      return "w-full"; // Full width for small screens
    }
    if (width < 1024) {
      return "w-4/5"; // Full width for small screens
    }

    switch (size) {
      case "xs":
        return "w-80";
      case "sm":
        return "w-96";
      case "md":
        return "w-1/2";
      case "lg":
        return "w-4/5";
      case "xl":
        return "w-[90%]";
      default:
        return "w-1/2";
    }
  }, [size, width]);

  // Animation variants for the drawer - using easeInOut for smooth non-bouncy animation
  const drawerVariants = {
    hidden: {
      x: position === "right" ? "100%" : "-100%",
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "tween",
        ease: "easeInOut",
        duration: 0.3,
      },
    },
    exit: {
      x: position === "right" ? "100%" : "-100%",
      opacity: 0,
      transition: {
        type: "tween",
        ease: "easeInOut",
        duration: 0.3,
      },
    },
  };

  // Animation variants for the backdrop - smooth fade transition
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      {show && (
        <div>
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
            className="fixed inset-0 bg-black/40 z-[1000]"
            onClick={() => {
              backDrop && onClose && onClose();
            }}
          />
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
            id={id || "drawer"}
            className={`z-[1200] justify-between fixed top-0 ${position}-0 h-full bg-white shadow-[0px_2px_12px_0px_#0A0A381A] flex-col flex ${drawerWidth} max-w-[1600px]`}
          >
            {title && <DrawerHeader onClose={onClose} title={title} />}
            <AnimatedContainerBase key={show}>{children}</AnimatedContainerBase>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default memo(Drawer);
