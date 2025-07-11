import React, { useEffect, useState } from "react";
import Typography from "@/components/Typography";
import allImgPaths from "@/assets";

interface CompanyContextProps {
  className?: string;
}

const CompanyContext: React.FC<CompanyContextProps> = ({ className = "" }) => {
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyRole, setCompanyRole] = useState<string | null>(null);
  const deploymentType = import.meta.env.VITE_DEPLOYMENT_TYPE;

  useEffect(() => {
    // Only show company context in SaaS mode
    if (deploymentType === "saas") {
      const selectedCompanyName = localStorage.getItem("selected_company_name");
      const selectedCompanyRole = localStorage.getItem("selected_company_role");
      
      setCompanyName(selectedCompanyName);
      setCompanyRole(selectedCompanyRole);
    }
  }, [deploymentType]);

  // Don't render anything if not in SaaS mode or no company selected
  if (deploymentType !== "saas" || !companyName) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={allImgPaths.groupIcon} 
        alt="Company" 
        className="w-5 h-5"
      />
      <Typography variant="body2" className="text-gray-600">
        {companyName} {companyRole && `(${companyRole})`}
      </Typography>
    </div>
  );
};

export default CompanyContext;
