import allImgPaths from "@/assets";
import { useAppState } from "@/context";
import { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { HOST, ROLES } from "@/shared/constants";
import { filterMenu } from "@/shared/functions";
import { size } from "lodash-es";
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import SearchMessage from "../SearchMessage";

const MenuList = ({
  toggleMobileSideBar,
}: {
  toggleMobileSideBar: () => void;
}) => {
  const [isShowSearchModal, setIsShowSearchModal] = useState(false);
  const { sidebarCollapse = false } = useAppState(RootState.COMMON);
  const isSaasDeployment = HOST.DEPLOYMENT_TYPE === "saas";

  const {
    user: {
      role = "",
      preferences: { language },
    },
    isLoading,
    imposterUser: { role: imposterRole = "" },
  } = useAppState(RootState.AUTH);
  const { translate } = useTranslate();

  const menuList = useMemo(() => {
    let filteredMenus: any = filterMenu({ imposterRole, role });
    filteredMenus = filteredMenus.map((menu: any) => {
      return {
        ...menu,
        label: translate(`sidebar.${menu.key}` as any),
      };
    });

    if (isSaasDeployment) {
      filteredMenus = filteredMenus.filter(
        (menu: any) => menu.key !== "configuration",
      );
    }

    filteredMenus = filteredMenus.filter(
      (menu: any) => !menu.isIgnoreInMainMenu,
    );

    if (imposterRole === ROLES.CHATTER) {
      // add search chat object into filteredMenus at 1th index
      filteredMenus.splice(1, 0, {
        key: "search",
        label: translate(`common.searchChats` as any),
        url: "",
        onClick: () => setIsShowSearchModal(true),
        icon: allImgPaths.searchChat,
      });
    }
    return filteredMenus;
  }, [role, imposterRole, isLoading, language]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); // Prevents "/" from being typed in input
        setIsShowSearchModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <>
      {!isLoading &&
        size(menuList) > 0 &&
        menuList.map(({ icon, label, url, onClick }: any, index: number) => (
          <div key={index}>
            <NavLink
              to={url}
              className={({ isActive }) =>
                `${isActive && url !== "" && "active group"} group`
              }
              onClick={() => {
                toggleMobileSideBar();
                onClick?.();
              }}
            >
              <div
                title={label}
                className="text-tertiary-700 group-[.active]:bg-secondary-900 group-[.active]:text-white flex gap-x-2 items-center bg-header hover:bg-secondary-200 hover:text-primary-900 transition-all duration-300 rounded-2xl py-3 px-4 mb-2 group"
              >
                <img
                  src={icon}
                  alt={label}
                  className="group-[.active]:invert h-5 w-5"
                />
                {!sidebarCollapse && (
                  <p className="text-sm font-medium">{label}</p>
                )}
                {/* Icon on the right side for "Chats" on hover */}
                {!sidebarCollapse && label === "Chats" && (
                  <>
                    <div className="group-[.active]:flex hidden justify-center items-center px-2 py-1 ml-auto h-7 font-medium bg-white rounded-md border-md text-tertiary-700">
                      <span className="">New Chat</span>
                    </div>
                  </>
                )}
              </div>
            </NavLink>
          </div>
        ))}

      <SearchMessage
        show={isShowSearchModal}
        onClose={() => {
          setIsShowSearchModal(false);
        }}
      />
    </>
  );
};

export default MenuList;
