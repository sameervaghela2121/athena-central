import allImgPaths from "@/assets";
import useAppState, { RootState } from "@/context/useAppState";
import { useEffect, useMemo, useState } from "react";
import Billing from "./billing";
import Usage from "./usage";

/**
 * Main component for the plan pricing page
 * @returns The plan pricing page component
 */
const Main = () => {
  // tab
  const [selectedTab, setSelectedTab] = useState("usage");
  const { entity } = useAppState(RootState.AUTH);
  const { fetchEntityUsageMetrics, fetchCurrentTier } = useAppState(
    RootState.PLAN_PRICING,
  );

  const { company_id: companyId = "", tier_id: currentPlanId } = entity || {};

  if (!companyId) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 rounded-md">
        Company not found
      </div>
    );
  }

  useEffect(() => {
    if (currentPlanId) {
      fetchCurrentTier(currentPlanId);
    }
  }, [currentPlanId]);

  useEffect(() => {
    fetchEntityUsageMetrics();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get("tab");
    if (tab) {
      setSelectedTab(tab);
    }
  }, []);

  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId);
    // change URL query string tab = tabId
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", tabId);
    window.history.replaceState(null, "", `?${searchParams.toString()}`);
  };

  const TABS = [
    { label: "Usage", id: "usage", icon: allImgPaths.plans },
    { label: "Billing", id: "billing", icon: allImgPaths.billingIcon },
  ];

  /**
   * Memoized component based on selectedTab
   * Prevents unnecessary re-renders by only rendering the selected component
   */
  const selectedComponent = useMemo<JSX.Element>(() => {
    const components: Record<string, JSX.Element> = {
      usage: <Usage />,
      billing: <Billing />,
    };
    return components[selectedTab] || <></>;
  }, [selectedTab]);

  return (
    <main className="flex-grow p-7">
      <div className="overflow-hidden rounded-lg border">
        <div className="px-6 py-4 bg-header">
          <div className="flex gap-4 p-2 bg-white rounded-lg border w-fit">
            {TABS.map((item, index) => (
              <div
                key={index}
                className={`flex gap-2 items-center p-2 px-4 cursor-pointer rounded-lg duration-200 select-none ${
                  selectedTab === item.id ? "bg-secondary-900 text-white" : ""
                }`}
                onClick={() => {
                  handleTabChange(item.id);
                }}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className={`${selectedTab === item.id ? "invert" : ""}`}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl h-[calc(100vh-296px)] overflow-y-auto p-3">
          {selectedComponent}
        </div>
      </div>
    </main>
  );
};

export default Main;
