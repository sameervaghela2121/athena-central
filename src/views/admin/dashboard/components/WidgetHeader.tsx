const WidgetHeader = ({
  title,
  info,
  right,
}: {
  title: any;
  info?: any;
  right?: any;
}) => {
  return (
    <div className="flex items-center justify-between w-full mb-4 gap-x-1">
      <div className="flex gap-x-1">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <div>{info}</div>
      </div>
      <div>{right}</div>
    </div>
  );
};

export default WidgetHeader;
