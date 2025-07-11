import React from "react";

const WidgetCard = ({ children }: { children?: React.ReactNode }) => {
  return <div className="p-4 border shadow-sm rounded-2xl">{children}</div>;
};

export default WidgetCard;
