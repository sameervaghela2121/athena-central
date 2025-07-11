interface Props {
  options: { label: any; value: number }[];
  selected: number;
  className?: string;
  onChange: (selected: number) => void;
}
const Tabs = ({
  options = [],
  className = "",
  selected = 0,
  onChange = () => {},
}: Props) => {
  return (
    <div className={`w-max rounded-lg shadow-md p-2 flex gap-x-2 ${className}`}>
      {options.map((option, index) => (
        <button
          type="button"
          onClick={() => onChange(option.value)}
          key={index}
          className={`duration-150 rounded-lg ${selected === option.value ? "active group bg-secondary-900  text-white" : "bg-tertiary-50 text-tertiary-400"} p-2 `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
