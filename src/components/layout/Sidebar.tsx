import allImgPaths from "@/assets";
import useAppState, { RootState } from "@/context/useAppState";
import { useBasePath, useTranslate } from "@/hooks";
import {
  BOTTOM_MENU_ITEMS,
  DEFAULT_ADMIN_URL,
  ROLES,
} from "@/shared/constants";
import { size } from "lodash-es";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import SearchMessage from "./SearchMessage";
import { RecentChatHistory } from "./components";

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem("isCollapsed") === "false",
  );
  const [isMobile, setIsMobile] = useState(false);
  const [isShowSearchModal, setIsShowSearchModal] = useState(false);

  const navigate = useNavigate();
  const basePath = useBasePath();
  const { translate } = useTranslate();

  const { toggleMobileSideBar, mobileSidebarOpen } = useAppState(
    RootState.COMMON,
  );

  const {
    isAdmin,
    user: {
      role = "",
      preferences: { language },
    },
    imposterUser: { role: imposterRole },
    changeImposterUser,
  } = useAppState(RootState.AUTH);

  const isImposterAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(
    imposterRole,
  );

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

  // Check for mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleMenuClick = (action: string, url: string) => {
    switch (action) {
      case "search":
        setIsShowSearchModal(true);
        break;
      case "switch-portal":
        const newRole = [ROLES.QUEUES_SUPPORT, ROLES.CHATTER].includes(
          imposterRole,
        )
          ? role
          : ROLES.QUEUES_SUPPORT;

        switch (newRole) {
          case ROLES.QUEUES_SUPPORT:
            navigate("/chats");
            break;
          case ROLES.ADMIN:
          case ROLES.SUPER_ADMIN:
            navigate(DEFAULT_ADMIN_URL);
            break;
          default:
            break;
        }

        changeImposterUser({
          role: newRole,
        });
        break;

      default:
        navigate(url);
        break;
    }
  };

  const topMenuItems = [
    {
      key: "startNewChat",
      icon: allImgPaths.chatAddOn,
      label: "Start New Chat",
      action: "new-chat",
      url: "/chats?isNew=true",
      allowedRoles: [ROLES.QUEUES_SUPPORT, ROLES.CHATTER],
    },
    {
      key: "searchChats",
      icon: allImgPaths.searchChat,
      label: "Search Chats",
      action: "search",
      url: "/search",
      allowedRoles: [ROLES.QUEUES_SUPPORT, ROLES.CHATTER],
    },
    {
      key: "questions",
      icon: allImgPaths.question,
      label: "Questions",
      action: "questions",
      url: "/questions",
      allowedRoles: [ROLES.QUEUES_SUPPORT],
    },
    // {
    //   key: "chats",
    //   icon: allImgPaths.chats,
    //   label: "Chats",
    //   action: "new-chat",
    //   url: "/chats",
    //   allowedRoles: [ROLES.QUEUES_SUPPORT],
    // },
    {
      key: "KEs",
      icon: allImgPaths.KE,
      label: "Library",
      action: "library",
      url: "/KEs",
      allowedRoles: [ROLES.QUEUES_SUPPORT, ROLES.CHATTER],
    },
    {
      key: "dashboard",
      icon: allImgPaths.dashboard,
      label: "Dashboard",
      action: "dashboard",
      url: "/admin/dashboard",
      allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    },
    {
      key: "queues",
      icon: allImgPaths.queues,
      label: "Queues",
      action: "queues",
      url: "/admin/queues",
      allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    },
    {
      key: "users",
      icon: allImgPaths.userDark,
      label: "Users",
      action: "users",
      url: "/admin/users",
      allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    },
    {
      key: "roles",
      icon: allImgPaths.roleIcon,
      label: "Roles",
      action: "roles",
      url: "/admin/roles",
      allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    },
    {
      key: "configuration",
      icon: allImgPaths.config,
      label: "Configuration",
      action: "configuration",
      url: "/admin/configuration",
      allowedRoles: [ROLES.SUPER_ADMIN],
    },
    {
      key: "plansBilling",
      icon: allImgPaths.plans,
      label: "Plan & Pricing",
      action: "plan-pricing",
      url: "/admin/plans-billing",
      allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    },
  ];

  const filteredBottomMenuItems = useMemo(() => {
    const menus = BOTTOM_MENU_ITEMS.filter((menu) => {
      // Always include switch-portal menu if user is admin or super admin
      if (
        menu.action === "switch-portal" &&
        [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role)
      ) {
        return true;
      }

      // Exclude queues menu when imposter role is QUEUE_SUPPORT and actual role is ADMIN or SUPER_ADMIN
      if (
        menu.action === "queues" &&
        imposterRole === ROLES.QUEUES_SUPPORT &&
        [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role)
      ) {
        return false;
      }

      // For all other menu items, check if they're allowed for the imposter role
      return menu.allowedRoles.includes(imposterRole);
    });

    menus.forEach((menu) => {
      if (menu.action === "switch-portal") {
        menu.label = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(imposterRole)
          ? translate("sidebar.goToUserPortal")
          : translate("sidebar.goToAdminPortal");
      } else {
        menu.label = translate(`sidebar.${menu.key}` as any);
      }
    });
    return menus;
  }, [role, imposterRole, language]);

  const filteredTopMenuItems = useMemo(() => {
    const menus = topMenuItems.filter((menu) =>
      menu.allowedRoles.includes(imposterRole),
    );

    menus.forEach((menu) => {
      menu.label = translate(`sidebar.${menu.key}` as any);
    });
    return menus;
  }, [role, imposterRole, language]);

  const isMenuSelected = (url: string) => {
    if (url === "/search") {
      return false;
    }

    return url === basePath;
  };

  const onToggleCollapseClick = () => {
    setIsCollapsed(!isCollapsed);
    localStorage.setItem("isCollapsed", isCollapsed ? "true" : "false");
  };

  // Mobile sidebar overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-60"
            onClick={() => toggleMobileSideBar(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`fixed top-0 left-0 z-50 h-full max-w-96 w-full bg-white shadow-xl transform transition-transform duration-300 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex relative flex-col h-full">
            {/* Mobile Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                <NavLink
                  to={`${isImposterAdmin ? DEFAULT_ADMIN_URL : "/chats"}`}
                >
                  <img
                    src={allImgPaths.appLogo}
                    alt="main logo"
                    className="h-6 sm:h-7"
                  />
                </NavLink>
              </h2>
              <button
                onClick={() => toggleMobileSideBar(false)}
                className="p-2 rounded-full transition-colors hover:bg-gray-100"
              >
                <img
                  src={allImgPaths.closeIcon}
                  className="w-5 h-5 text-gray-500"
                />
              </button>
            </div>

            {/* Mobile Content */}
            <div className="flex overflow-hidden flex-col flex-1">
              {/* Top Menu */}
              <div className="p-4 space-y-2">
                {filteredTopMenuItems.map((item, index) => (
                  <button
                    key={index}
                    className="flex gap-3 items-center px-4 py-3 w-full text-left rounded-xl transition-colors hover:bg-gray-50"
                    onClick={() => {
                      handleMenuClick(item.action, item.url);
                      if (item.action !== "search") toggleMobileSideBar(false);
                    }}
                  >
                    <img src={item.icon} className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Bottom Menu */}
              <div className="absolute bottom-0 p-4 space-y-2 w-full border-t border-gray-100">
                {filteredBottomMenuItems.map((item, index) => (
                  <button
                    key={index}
                    className="flex gap-3 items-center px-4 py-2 w-full text-left rounded-lg transition-colors hover:bg-gray-50"
                    onClick={() => {
                      handleMenuClick(item.action, item.url);
                    }}
                  >
                    <img src={item.icon} className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div
      className={`relative pt-10 pr-0 flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 h-screen ${
        isCollapsed ? "w-20 group" : "w-80"
      }`}
    >
      {/* Top Section - Sticky */}
      <div className="flex-shrink-0 p-4 pt-0 bg-white border-gray-100">
        <div
          className={`flex ${isCollapsed ? "justify-center" : "justify-between pl-3"} items-center`}
        >
          {!isCollapsed && (
            <NavLink to={`${isImposterAdmin ? DEFAULT_ADMIN_URL : "/chats"}`}>
              <img
                src={allImgPaths.appLogo}
                alt="main logo"
                className="h-6 sm:h-7"
              />
            </NavLink>
          )}
          <button
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors hover:bg-tertiary-50 text-gray-700 ${
              isCollapsed ? "justify-center" : "justify-start"
            }`}
            onClick={onToggleCollapseClick}
          >
            <img
              src={
                isCollapsed ? allImgPaths.athenaLogo : allImgPaths.collapseIcon
              }
              className="block flex-shrink-0 w-6 h-6 group-hover:hidden"
            />
            <img
              src={allImgPaths.collapseIcon}
              className={`hidden flex-shrink-0 w-6 h-6 group-hover:block ${isCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div className="mt-4 space-y-0 border-t">
          {filteredTopMenuItems.map((item, index) => (
            <button
              key={index}
              className={`w-full border border-l-4  border-transparent rounded-l-none flex items-center gap-3 px-3 py-3 rounded-xl transition-colors hover:bg-tertiary-50 text-gray-700 ${
                isCollapsed ? "justify-center" : "justify-start"
              } ${isMenuSelected(item.url) ? "bg-secondary-200 text-primary-900 border border-l-4  !border-secondary-900 " : ""}`}
              onClick={() => handleMenuClick(item.action, item.url)}
              title={isCollapsed ? item.label : ""}
            >
              <img
                src={item.icon}
                className={`flex-shrink-0 w-5 h-5 ${isMenuSelected(item.url) ? "" : "grayscale"}`}
              />
              {!isCollapsed && (
                <span className="text-sm font-medium text-left line-clamp-1">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {(imposterRole === ROLES.CHATTER ||
        (basePath === "/chats" && !isCollapsed)) && (
        <>
          {/* Add padding to bottom to make space for upgrade notification */}
          <RecentChatHistory />
        </>
      )}

      {/* Bottom Section - Sticky */}
      {size(filteredBottomMenuItems) > 0 && (
        <div className="absolute bottom-0 flex-shrink-0 p-4 w-full bg-white border-t border-gray-100">
          <div className="space-y-0">
            {filteredBottomMenuItems.map((item, index) => (
              <button
                key={index}
                className={`w-full border border-l-4 border-transparent rounded-l-none flex items-center gap-3 px-3 py-3 rounded-xl transition-colors hover:bg-tertiary-50 text-gray-700 ${
                  isCollapsed ? "justify-center" : "justify-start"
                } ${isMenuSelected(item.url) ? "bg-secondary-200 text-primary-900 border border-l-4  !border-secondary-900 " : ""}`}
                onClick={() => handleMenuClick(item.action, item.url)}
                title={isCollapsed ? item.label : ""}
              >
                <img
                  src={item.icon}
                  className={`flex-shrink-0 w-5 h-5 ${isMenuSelected(item.url) ? "" : "grayscale"}`}
                />
                {!isCollapsed && (
                  <span className="text-sm font-medium text-left line-clamp-1">
                    {item.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      <SearchMessage
        show={isShowSearchModal}
        onClose={() => {
          setIsShowSearchModal(false);
        }}
      />
    </div>
  );
}

export default Sidebar;
