import { motion } from "framer-motion";
const Switch = ({
  disabled = false,
  checked = false,
  label = "",
  id = "",
  onChange = () => {},
}: {
  disabled?: boolean;
  checked?: boolean;
  label?: any;
  id?: string;
  onChange: () => void;
}) => {
  const spring = {
    type: "spring",
    stiffness: 700,
    damping: 30,
  };

  return (
    <div>
      <label htmlFor={id} className="flex items-center cursor-pointer">
        <div
          className={`w-11 h-6 bg-status-info/80 flex ${
            checked
              ? "justify-end bg-primary-500"
              : "justify-start opacity-50 bg-secondary-700"
          } ${disabled ? "bg-tertiary-100" : "bg-status-info/80"} rounded-full p-1 cursor-pointer`}
          data-isOn={disabled || checked}
          onClick={() => !disabled && onChange && onChange()}
        >
          <motion.div
            className="w-4 h-4 bg-white rounded-full"
            layout
            transition={spring}
          />
        </div>
        <div className="ml-3 font-medium select-none">{label}</div>
      </label>
    </div>
  );
};

export default Switch;
