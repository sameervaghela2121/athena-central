import { motion } from "framer-motion";
import { useEffect } from "react";

export const AnimatedContainerBase = (props: any) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <motion.div
      className=""
      initial={{ opacity: props.quick ? 0.5 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: props.quick ? 0.5 : 0.7 }}
    >
      <div className="">{props.children}</div>
    </motion.div>
  );
};
