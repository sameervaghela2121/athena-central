import { generateColorHsl } from "@/shared/functions";
import { upperCase } from "lodash";

const UserListOption = ({ data, isSelected, innerProps }: any) => {
  const color = generateColorHsl(`${data.label} ${data.email}`);

  return (
    <div
      {...innerProps}
      className={`hover:border-l-primary-900 border-l-2 border-l-transparent flex flex-col custom-option gap-x-1 cursor-pointer hover:bg-tertiary-50 duration-300 p-2 ${isSelected ? "bg-secondary-200" : "bg-transparent"}`}
    >
      <div className="flex gap-x-2">
        <div>
          <div
            className="flex items-center justify-center w-12 h-12 text-white rounded-full bg-tertiary-600"
            style={{ backgroundColor: color }}
          >
            {upperCase(data.label.slice(0, 2))}
          </div>
        </div>
        <div>
          <div className="flex items-center">
            <span className="text-gray-900">{data.label}</span>
          </div>
          <div>
            <span className="text-sm italic text-gray-500">{data.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserListOption;
