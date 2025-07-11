import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "@/apis/chats";
import usersApi from "@/apis/users";
import allImgPaths from "@/assets";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import {
  APP_VERSION,
  DEFAULT_ADMIN_URL,
  ROLES,
  SITE_LANGUAGES,
} from "@/shared/constants";
import {
  calculatePercentage,
  getToken,
  renameRoleLabel,
} from "@/shared/functions";
import Divider from "../Divider";
import Dropdown from "../Dropdown";
import Popover from "../Popover";
import SettingsModal from "../settings/SettingsModal";

type Language = {
  id: string;
  name: string;
};

const Header = ({ title }: { title?: string }) => {
  const params: any = useParams();
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [chatStatus, setChatStatus] = useState<any>(null);
  const navigate = useNavigate();
  const { translate, i18n } = useTranslate();

  const { toggleMobileSideBar } = useAppState(RootState.COMMON);
  const {
    updateUserSettings,
    user: {
      preferences: { language },
    },
  } = useAppState(RootState.AUTH);
  const {
    isAdmin,
    logout,
    user: { id, name, role = "", entity = "" },
    imposterUser: { role: imposterRole },
    changeImposterUser,
  } = useAppState(RootState.AUTH);

  const handleLanguageChange = (selectedLang: Language) => {
    i18n.changeLanguage(selectedLang.id);
    updateUserSettings({ language: selectedLang.id });
  };

  const onLogout = () => {
    logout();
    toggleMobileSideBar(false);
  };

  const checkChatStatus = async () => {
    try {
      const result = await usersApi.getEntityUsageStatus();

      setChatStatus(result);
    } catch (error) {
      console.error("checkChatStatus error", error);
    }
  };

  useEffect(() => {
    // checkChatStatus();
    setInterval(() => {
      const token = getToken();
      if (!token) {
        logout();
      }
    }, 2000);
  }, [id]);

  useEffect(() => {
    // Log application information only once when component mounts
    const userName = name;
    const userId = id;
    const userRole = renameRoleLabel(role);
    const userEntity = entity;

    console.log(
      "%c📊 AthenaPro %c" + (APP_VERSION || "Unknown").slice(-10),
      "color: #a5f3fc; background: #0f172a; font-size:12px; font-weight: bold; padding: 5px 8px; border-radius: 4px 0 0 4px;",
      "color: #f1f5f9; background: #1e293b; font-size:12px; font-weight: bold; padding: 5px 8px; border-radius: 0 4px 4px 0;",
    );

    /**
     * Displays user and environment information in a table format
     */
    const logUserInfo = () => {
      console.log(
        "%c User Information ",
        "background: #1e293b; color: white; font-weight: bold; padding: 4px 8px; border-radius: 3px;",
      );

      console.table({
        "🔖 Environment": import.meta.env.MODE.toUpperCase(),
        "👤 User Name": userName,
        "🆔 User ID": userId,
        "🔑 Role": userRole,
        "🏢 Entity": userEntity,
      });
    };

    logUserInfo();
  }, []);

  const SITE_LANGUAGES_OPTIONS = useMemo(() => {
    return SITE_LANGUAGES.map((lang) => ({
      id: lang.id,
      name: translate(`settings.language.${lang.key}` as any),
      key: lang.key,
    }));
  }, [SITE_LANGUAGES, language]);

  const getSelectedLanguage = () => {
    return (
      SITE_LANGUAGES_OPTIONS.find((o) => o.id === language)?.name ??
      SITE_LANGUAGES_OPTIONS[0].name
    );
  };

  // Animation variants for progress bars
  const progressVariants = {
    initial: { width: 0 },
    animate: (percent: number) => ({
      width: `${percent}%`,
      transition: { duration: 0.2, ease: "easeOut" },
    }),
  };

  return (
    <div className="flex flex-wrap gap-y-2 justify-between items-center sm:gap-y-0">
      {/* Settings Modal */}
      <SettingsModal
        show={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <div className="flex gap-x-3 items-center">
        {/* Menu Icon - Visible on screens below md breakpoint */}
        <div
          className="p-2 rounded-full transition-all cursor-pointer md:hidden hover:bg-secondary-200"
          onClick={() => toggleMobileSideBar()}
        >
          <img
            src={allImgPaths.menuIcon}
            alt="Menu"
            className="w-6 h-6 transition-transform duration-200 hover:scale-110 active:scale-95"
          />
        </div>

        {/* Title */}
        <h2 className="text-sm font-black text-left whitespace-nowrap select-none sm:text-2xl text-primary-900">
          {title}
        </h2>
      </div>

      <div className="flex flex-1 gap-x-2 justify-end items-center sm:gap-x-5">
        {params.id && window.location.pathname.includes("/chats") && (
          <Dropdown
            className="text-xs min-w-32 sm:text-sm sm:!w-64 flex flex-row sm:flex-none !w-12"
            label="Download"
            items={[
              { id: "pdf", name: `${translate("chats.export.pdf")}` },
              { id: "doc", name: `${translate("chats.export.doc")}` },
            ]}
            onSelect={(item) =>
              api.handleExport(params.id, item.id as "pdf" | "doc")
            }
          />
        )}
        <div className="hidden flex-shrink-0 sm:block">
          <Dropdown
            className="text-xs min-w-20 sm:text-sm"
            label={getSelectedLanguage()}
            items={SITE_LANGUAGES_OPTIONS}
            onSelect={(item) => handleLanguageChange(item as Language)}
            selectedItem={{ id: language, name: getSelectedLanguage() }}
          />
        </div>
        <div className="flex gap-x-1 sm:gap-x-2 shrink-0">
          <Popover
            position="bottom"
            classes="rounded-lg !p-0 overflow-hidden md:ml-6"
            content={
              <div className="w-[300px]">
                <div className="flex flex-col">
                  <div className="flex flex-col px-5 py-3 border-l-2 cursor-pointer hover:bg-gray-100 hover:border-l-primary-900 border-l-transparent">
                    <div className="flex gap-x-1">
                      <div>
                        <img src={allImgPaths.userDark} />
                      </div>
                      <div>
                        <span className="text-base font-medium">{name}</span>
                      </div>
                    </div>
                    {/* <div>
                      <p className="ml-6 text-base font-medium truncate text-tertiary-400">
                        {email}
                      </p>
                    </div> */}
                  </div>

                  <div
                    className="px-5 py-3 border-l-2 cursor-pointer hover:bg-gray-100 hover:border-l-primary-900 border-l-transparent"
                    onClick={() => setShowSettingsModal(true)}
                  >
                    <div className="flex gap-x-1">
                      <div>
                        <img src={allImgPaths.settingsDark} />
                      </div>
                      <div>{translate("common.settings")}</div>
                    </div>
                  </div>

                  {isAdmin() && (
                    <>
                      <div
                        className="px-5 py-3 border-l-2 cursor-pointer hover:bg-gray-100 hover:border-l-primary-900 border-l-transparent"
                        onClick={() => {
                          const newRole = [
                            ROLES.QUEUES_SUPPORT,
                            ROLES.CHATTER,
                          ].includes(imposterRole)
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
                        }}
                      >
                        <div className="flex gap-x-1">
                          <div>
                            <img
                              src={
                                [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(
                                  imposterRole,
                                )
                                  ? allImgPaths.userPortal
                                  : allImgPaths.dashboardDark
                              }
                            />
                          </div>
                          <div>
                            {[ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(
                              imposterRole,
                            )
                              ? translate("sidebar.goToUserPortal")
                              : translate("sidebar.goToAdminPortal")}
                          </div>
                        </div>
                      </div>
                      <Divider className="bg-tertiary-50" />
                    </>
                  )}
                  {chatStatus && (
                    <div className="flex flex-col gap-1 p-5 rounded-md bg-header">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-black">
                          Credits Used
                        </p>
                        <p
                          className="text-xs font-medium transition-opacity ease-in-out cursor-pointer duration-125 hover:opacity-80 text-affirmative-primary"
                          onClick={() => navigate("/plans-billing?tab=plan")}
                        >
                          Upgrade
                        </p>
                      </div>
                      <div className="flex gap-2 items-center w-full">
                        <div className="relative w-full overflow-hidden rounded-full bg-header-active h-[7px] min-w-0 flex-1">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary-100 via-primary-500 to-primary-700"
                            variants={progressVariants}
                            initial="initial"
                            animate="animate"
                            custom={calculatePercentage(
                              chatStatus?.message_count -
                                chatStatus?.remaining_message_count || 0,
                              chatStatus?.message_count || 0,
                            )}
                          />
                        </div>
                        <p className="text-xs text-black">
                          {chatStatus?.message_count -
                            chatStatus?.remaining_message_count}
                          /{chatStatus?.message_count}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-between items-center">
                        <p className="max-w-[35ch] text-wrap text-xs text-black">
                          Your daily credits renew at midnight UTC
                        </p>
                        {/* <button data-state="closed" className="text-black">
                        <Tooltip
                          content="You get 5 free credits daily (up to 30 per month)."
                          place="left"
                        >
                          <img
                            src={allImgPaths.info}
                            alt="info"
                            className="w-5 h-5"
                          />
                        </Tooltip>
                      </button> */}
                      </div>
                    </div>
                  )}
                  <Divider className="bg-tertiary-50" />
                  <div
                    className="px-5 py-3 border-l-2 cursor-pointer hover:bg-gray-100 hover:border-l-primary-900 border-l-transparent"
                    onClick={() => onLogout()}
                  >
                    <div className="flex gap-x-1">
                      <div>
                        <img src={allImgPaths.logout} />
                      </div>
                      <div>{translate("common.logout")}</div>
                    </div>
                  </div>
                </div>
              </div>
            }
            trigger={
              <div className="p-1 m-2 rounded-full duration-200 cursor-pointer sm:p-3 hover:bg-secondary-900 bg-secondary-900/80">
                <img
                  src={allImgPaths.usersIconWhite}
                  alt="userBlue"
                  className="sm:w-5 sm:h-5"
                />
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
