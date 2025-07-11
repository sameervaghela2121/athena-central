const Alert = ({
  text,
  severity = "info",
  show = true,
}: {
  text: string;
  severity: "success" | "info" | "warning" | "error";
  show?: boolean;
}) => {
  const getClass = () => {
    switch (severity) {
      case "success":
        return "text-[#1e4620] bg-[#edf7ed]";
      case "info":
        return "text-[#014361] bg-[#e5f6fd]";
      case "error":
        return "text-[#5f2120] bg-[#fdeded]";
      case "warning":
        return "text-[#663c00] bg-[#fff4e5]";

      default:
        break;
    }
    return "text-red-500";
  };
  return (
    <>
      {show && (
        <div className={`${getClass()} py-3 px-4 rounded-md`}>{text}</div>
      )}
    </>
  );
};

export default Alert;
