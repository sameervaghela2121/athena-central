import allImgPaths from "@/assets";
import React, { useState } from "react";

interface SpeedDialAction {
  icon: React.ReactNode;
  name: string;
  onClick: () => void;
}

interface SpeedDialProps {
  actions: SpeedDialAction[];
}

const SpeedDial: React.FC<SpeedDialProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSpeedDial = () => {
    // setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      {/* Main Floating Button */}
      <button
        onClick={toggleSpeedDial}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none"
      >
        <img src={allImgPaths.more} />
      </button>

      {/* Action buttons */}
      <div
        className={`flex items-center absolute bottom-0 gap-x-3 right-14 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="bg-gray-100 text-gray-700 p-3 rounded-full shadow-lg hover:bg-gray-200 focus:outline-none"
            title={action.name}
          >
            {action.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SpeedDial;
