import { LoaderCircle } from "@/components";
import React from "react";

const GraphRender = ({
  isLoading,
  children,
}: {
  isLoading: boolean;
  children: React.ReactNode;
}) => {
  return (
    <div>
      {isLoading ? <LoaderCircle text="" className="min-h-80" /> : children}
    </div>
  );
};

export default GraphRender;
