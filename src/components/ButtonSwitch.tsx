import { motion } from "framer-motion";

const spring = {
  type: "spring",
  stiffness: 700,
  damping: 30,
  duration: 0.2,
  ease: "easeInOut",
};

const ButtonSwitch = ({
  checkedIcon = "",
  unCheckedIcon = "",
  checked = false,
  onChange = () => {},
}: {
  checkedIcon: any;
  unCheckedIcon: any;
  checked: boolean;
  onChange: () => void;
}) => {
  return (
    <div
      className={`btn-switch relative flex items-center gap-x-2 ${checked ? "checked" : ""}`}
      data-isOn={checked}
      onClick={onChange}
    >
      {checked && (
        <span className="font-medium text-secondary-900">Normal</span>
      )}
      <motion.div
        className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center select-none handle"
        layout
        transition={spring}
      >
        <img
          src={checked ? checkedIcon : unCheckedIcon}
          alt=""
          className="h-6 w-6"
        />
      </motion.div>
      {!checked && <span className="font-medium text-white">Admin</span>}
    </div>
  );
};

export default ButtonSwitch;
