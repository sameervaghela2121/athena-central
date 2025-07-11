import React from "react";

import allImgPaths from "@/assets";

const Empty = ({ description, image }: { description?: any; image?: any }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="mb-4">
        <img
          src={image || allImgPaths.noRecord}
          className="w-24 h-24 text-gray-400"
        />
      </div>
      <div className="text-gray-500 text-sm">{description || "No Data"}</div>
    </div>
  );
};

export default React.memo(Empty);
