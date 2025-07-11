import allImgPaths from "@/assets";
import Select, {
  GroupBase,
  OptionsOrGroups,
  Props as ReactSelectProps,
  StylesConfig,
  components,
} from "react-select";
import AsyncSelect from "react-select/async";

import ClearIndicator from "./ClearIndicator";
import ErrorText from "./ErrorText";

interface CustomSelectProps<OptionType>
  extends ReactSelectProps<OptionType, true, GroupBase<OptionType>> {
  value?: any;
  isAsync?: boolean;
  cacheOptions?: any;
  loadOptions?:
    | ((
        inputValue: string,
        callback: (
          options: OptionsOrGroups<OptionType, GroupBase<OptionType>>,
        ) => void,
      ) => void | Promise<any>)
    | undefined;
  defaultOptions?: any;
  errors?: any;
  chipColor?: string;
}

const CustomMultiValueRemove = (props: any) => (
  <components.MultiValueRemove {...props}>
    <img
      src={allImgPaths.closeIcon}
      className="w-3 h-3"
      onClick={() => props.removeProps.onClick()}
    />
  </components.MultiValueRemove>
);

const SelectComponent = <OptionType extends {}>({
  value,
  defaultValue,
  isAsync = false,
  cacheOptions,
  loadOptions,
  defaultOptions,
  errors,
  chipColor = "#f0f0f0",
  classNamePrefix = "athena-select",
  ...props
}: CustomSelectProps<OptionType>) => {
  const styles:
    | StylesConfig<OptionType, true, GroupBase<OptionType>>
    | undefined = {
    option: (provided) => ({
      ...provided,
      display: "flex",
      alignItems: "center",
      padding: "10px",
    }),
    menuList: () => ({
      // padding: "10px",
      maxHeight: 320,
      overflowY: "auto",
    }),
    control: (provided, state) => ({
      ...provided,
      backgroundColor: state.isDisabled ? "#EBEBEB" : "white", // Set the background color for disabled state

      borderColor: state.isFocused ? "#EBEBEB" : "", // Change border color on focus
      borderRadius: "8px",
      boxShadow: "none", // Removes the default focus border shadow
      "&:hover": {
        borderColor: "#EBEBEB", // Change border color on hover
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: chipColor, // Background color of each selected value
      borderRadius: "8px",
      padding: "2px",
      display: "flex",
      columnGap: "8px",
      margin: 0,
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#333", // Text color of the label
      textTransform: "capitalize",
    }),
    multiValueRemove: (provided, state) => ({
      ...provided,
      color: state.isFocused ? "" : "#555", // Change color when hovered or focused
      cursor: "pointer",
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "8px",
      gap: "2px",
    }),
    singleValue: (provided) => ({
      ...provided,
      // paddingLeft: "12px",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      alignItems: "center",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
    }),
  };

  const Options = ({ children, ...props }: any) => {
    const data: any = props.data;

    return (
      <div
        {...props.innerProps}
        className={`hover:border-l-primary-900 border-l-2 border-l-transparent flex flex-col custom-option gap-x-1 cursor-pointer hover:bg-tertiary-50 duration-300 p-2 ${props.isSelected ? "bg-secondary-200" : "bg-transparent"}`}
      >
        <div className="flex items-center">
          <span className="ml-2 text-gray-900">{data.label}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {isAsync ? (
        <AsyncSelect
          className="basic-single"
          classNamePrefix={classNamePrefix}
          isClearable={true}
          isSearchable={true}
          defaultOptions={defaultOptions}
          cacheOptions={cacheOptions}
          loadOptions={loadOptions}
          closeMenuOnSelect={false}
          components={{
            // Control,
            Option: Options,
            DropdownIndicator: () => null,
            IndicatorSeparator: () => null, // Removes dropdown indicator
            MultiValueRemove: CustomMultiValueRemove,
            ClearIndicator: ClearIndicator,
            ...props.components,
          }}
          styles={styles}
          value={value}
          {...props}
        />
      ) : (
        <Select
          className="basic-single"
          classNamePrefix={classNamePrefix}
          isClearable={true}
          isSearchable={true}
          closeMenuOnSelect={false}
          components={{
            // Control,
            Option: Options,
            DropdownIndicator: () => null,
            IndicatorSeparator: () => null, // Removes dropdown indicator
            MultiValueRemove: CustomMultiValueRemove,
            ClearIndicator: ClearIndicator,
            ...props.components,
          }}
          styles={styles}
          value={value}
          {...props}
        />
      )}

      <ErrorText errors={errors} name={props.name} />
    </>
  );
};

// export default memo(SelectComponent);
export default SelectComponent;
