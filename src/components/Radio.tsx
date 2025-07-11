import { uniqueId } from "lodash-es";

const Radio = ({
  checked = false,
  onChange = () => {},
  name = `name-${uniqueId()}`,
  id = uniqueId(),
  label = "",
  className = "",
  color = "",
}: {
  checked?: boolean;
  onChange: () => void;
  name?: string;
  id?: string;
  label?: any;
  className?: any;
  color?: string;
}) => {
  // TODO: redesign radio button component and replace with classic input radio tag

  return (
    <div className="flex items-center gap-x-2">
      {/* <input
        type="radio"
        name={name}
        id={id}
        checked={checked}
        onClick={onChange}
        className={`cursor-pointer rounded-full w-4 h-4 appearance-none border border-[#bababa]  checked:border-primary-900/80 checked:bg-primary-900/80 shadow-lg transition-all duration-300 ${className}`}
      /> */}
      <div className="relative flex">
        <input
          type="radio"
          name={name}
          id={id}
          checked={checked}
          onClick={onChange}
          className={`peer cursor-pointer rounded-full w-4 h-4 appearance-none border border-[#bababa] checked:border-primary-900/80 checked:bg-primary-900/80 shadow-lg transition-all duration-300 ${className}`}
        />
        {!checked && (
          <span
            className={`absolute top-1/2 left-1/2 h-[7px] w-[7px] ${color} ${className} rounded-full transform -translate-x-1/2 -translate-y-1/2 scale-1 peer-checked:scale-100 transition-transform duration-300`}
          ></span>
        )}
      </div>
      <label htmlFor={id} className="cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
};

export default Radio;
