const WidgetInfoTooltipContent = ({
  title = "",
  info,
}: {
  title: string;
  info: any;
}) => {
  return (
    <div className="w-96">
      <div className="flex items-center gap-x-2">
        <span className="inline-block w-3 h-3 rounded-full bg-tertiary-700" />
        <span className="font-bold text-tertiary-600">{title}</span>
      </div>
      <div className="flex flex-col mt-2 gap-y-2">{info}</div>
    </div>
  );
};

export default WidgetInfoTooltipContent;
