import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { tv } from "tailwind-variants";

import useOnEsc from "@/hooks/useOnEsc";
import { classes } from "@/shared/functions";

interface ModalProps {
  show: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  extraClasses?: string;
  className?: string;
  backdrop?: boolean;
}

const modalContent = tv({
  base: "bg-white shadow-lg rounded-2xl overflow-hidden p-5",
  variants: {
    size: {
      sm: "w-64",
      md: "w-96",
      lg: "w-[512px]",
      xl: "w-[640px]",
      "2xl": "w-[1200px]",
    },
  },
});

const Header = ({
  children,
  className,
}: {
  children: any;
  className?: string;
}) => (
  <div className={`flex flex-col p-5 bg-header ${className}`}>{children}</div>
);
const Footer = ({ children }: { children: any }) => (
  <div className="flex flex-col p-5 bg-white">{children}</div>
);

/**
 * Modal component with smooth animations using Framer Motion
 */
const Modal = ({
  show,
  onClose,
  children,
  size = "md",
  backdrop = false,
  extraClasses = "",
  className = "",
}: ModalProps) => {
  // Setup escape key handler
  useOnEsc(() => {
    backdrop && onClose && onClose();
  });

  // Animation variants for the backdrop
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

  // Animation variants for the modal content
  const contentVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "tween",
        ease: "easeOut",
        duration: 0.3,
        delay: 0.1, // Slight delay after backdrop appears
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: {
        type: "tween",
        ease: "easeIn",
        duration: 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          className={classes(
            "flex fixed inset-0 justify-center items-center h-screen bg-black bg-opacity-50 z-[900]",
            className,
          )}
          onClick={() => {
            backdrop && onClose && onClose();
          }} // Close modal when backdrop is clicked
        >
          <motion.div
            variants={contentVariants}
            className={classes(modalContent({ size }), extraClasses)}
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside the modal
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Modal.Header = Header;
Modal.Footer = Footer;

export default Modal;
