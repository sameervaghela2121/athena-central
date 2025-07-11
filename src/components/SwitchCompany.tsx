import React from "react";
import { useNavigate } from "react-router-dom";
import ButtonV2 from "./ButtonV2";
import allImgPaths from "@/assets";

interface SwitchCompanyProps {
  className?: string;
}

const SwitchCompany: React.FC<SwitchCompanyProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const deploymentType = import.meta.env.VITE_DEPLOYMENT_TYPE;

  // Don't render anything if not in SaaS mode
  if (deploymentType !== "saas") {
    return null;
  }

  const handleSwitchCompany = () => {
    navigate("/companies");
  };

  return (
    <ButtonV2
      className={`flex items-center gap-2 ${className}`}
      variant="secondary"
      onClick={handleSwitchCompany}
    >
      <img src={allImgPaths.groupIcon} alt="Switch" className="w-4 h-4" />
      Switch Company
    </ButtonV2>
  );
};

export default SwitchCompany;
