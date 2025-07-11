import keApi from "@/apis/KE";
import { motion } from "framer-motion";
import { get } from "lodash-es";
import { useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { Trans } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import api from "@/apis/auth";
import authApi from "@/apis/auth";
import chatsApi from "@/apis/chats";
import allImgPaths from "@/assets";
import { ButtonV2, Divider, Dropdown, Modal, Tooltip } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import {
  DATE_FORMATS,
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  HOST,
  ROLES,
  SITE_LANGUAGES,
} from "@/shared/constants";

/**
 * Settings modal component that provides UI for user settings
 * @param show - Boolean to control modal visibility
 * @param onClose - Function to handle modal close event
 * @returns Settings modal component
 */

const SettingsModal = ({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) => {
  const [activeMenu, setActiveMenu] = useState<
    "general" | "connectedApps" | "dataControls" | "security"
  >("general");

  const {
    user: {
      preferences: { language, date_format },
    },
    updateUserSettings,
  } = useAppState(RootState.AUTH);

  const {
    logout,
    user: { id: userId, is_google_authenticated = false, role = "" },
    updateUserState,
  } = useAppState(RootState.AUTH);
  const { updateUser } = useAppState(RootState.USERS);
  const { resetConversations } = useAppState(RootState.CHATS);

  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { translate, i18n } = useTranslate();

  /**
   * Handle date format change in settings
   * @param format - Date format identifier
   */
  const handleDateFormatChange = async (format: string) => {
    try {
      updateUserSettings({
        date_format: format,
      });
    } catch (error) {
      console.error("handleDateFormatChange Error:", error);
    }
  };

  /**
   * Handle language change in settings
   * @param langId - Language identifier
   */
  const handleLanguageChange = async (langId: string) => {
    try {
      updateUserSettings({
        language: langId,
      });
      i18n.changeLanguage(langId);
    } catch (error) {
      console.error("handleLanguageChange Error:", error);
    }
  };

  /**
   * Handle logout from current device
   */
  const handleLogoutDevice = () => {
    logout();
    onClose();
  };

  const deleteAllChats = async () => {
    try {
      // Call the API to delete all conversations
      const response = await chatsApi.deleteAllConversations();

      toast.success(
        get(response, "data.message", "All chats deleted successfully"),
      );

      resetConversations();
      if (location.pathname.includes("/chats") && params.id) {
        navigate("/chats");
      }
    } catch (error) {
      console.error("handleDeleteAllChats Error:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };
  /**
   * Handle delete all chats after successful hold
   */
  const handleDeleteAllChats = async () => {
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <Modal size="md" show={true} onClose={onClose}>
            <div className="flex flex-col gap-y-10">
              <div>
                <div className="flex justify-center">
                  <img
                    src={allImgPaths.chats}
                    alt="chat"
                    className="w-14 h-14"
                  />
                </div>
                <div className="flex flex-col gap-y-2 mt-4">
                  <p className="text-base font-medium text-center">
                    <Trans
                      i18nKey="settings.dataControlsSection.chatManagement.confirmDeleteMessage"
                      components={{
                        bold: <span className="font-bold text-status-error" />,
                      }}
                    />
                  </p>
                  <p className="text-base font-medium text-center">
                    {translate(
                      "settings.dataControlsSection.chatManagement.confirmDeleteMessageDescription",
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-x-5 justify-center">
                <div>
                  <ButtonV2 onClick={onClose} variant="tertiaryDark">
                    {translate("common.cancel")}
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    onClick={async () => {
                      deleteAllChats();
                      onClose();
                    }}
                    variant="error"
                    rightIcon={allImgPaths.rightArrow}
                  >
                    {translate("common.delete")}
                  </ButtonV2>
                </div>
              </div>
            </div>
          </Modal>
        );
      },
    });
  };

  const deleteAllKEs = async () => {
    try {
      // Call the API to delete all KEs
      const response = await keApi.deleteAllKEs();

      toast.success(
        get(
          response,
          "data.message",
          "All Knowledge Entries deleted successfully",
        ),
      );

      // If on KE detail page, navigate to KE list
      if (location.pathname.includes("/KEs")) {
        navigate("/KEs?force=true");
      }
    } catch (error) {
      console.error("deleteAllKEs Error:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  /**
   * Handle delete all KEs after successful hold
   */
  const handleDeleteAllKEs = async () => {
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <Modal size="md" show={true} onClose={onClose}>
            <div className="flex flex-col gap-y-10">
              <div>
                <div className="flex justify-center">
                  <img src={allImgPaths.fileIcon} alt="file-icon" />
                </div>
                <div className="flex flex-col gap-y-2 mt-4">
                  <p className="text-base font-medium text-center">
                    <Trans
                      i18nKey="settings.dataControlsSection.keManagement.confirmDeleteMessage"
                      components={{
                        bold: <span className="font-bold text-status-error" />,
                      }}
                    />
                  </p>
                  <p className="text-base font-medium text-center">
                    {translate(
                      "settings.dataControlsSection.keManagement.confirmDeleteMessageDescription",
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-x-5 justify-center">
                <div>
                  <ButtonV2 onClick={onClose} variant="tertiaryDark">
                    {translate("common.cancel")}
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    onClick={async () => {
                      deleteAllKEs();
                      onClose();
                    }}
                    variant="error"
                    rightIcon={allImgPaths.rightArrow}
                  >
                    {translate("common.delete")}
                  </ButtonV2>
                </div>
              </div>
            </div>
          </Modal>
        );
      },
    });
  };

  /**
   * Handle Google Drive connection by opening a popup for Google OAuth
   */
  const handleConnectGoogleDrive = () => {
    try {
      if (is_google_authenticated) {
        unsetGoogleAuth();
        return;
      }

      const clientId = GOOGLE_CLIENT_ID;
      const redirectUri = GOOGLE_REDIRECT_URI;
      const scope = "https://www.googleapis.com/auth/drive.file";

      const authUrl = `https://accounts.google.com/o/oauth2/auth?${new URLSearchParams(
        {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: scope,
          access_type: "offline",
          prompt: "consent",
          state: userId,
        },
      ).toString()}`;

      const width = 600;
      const height = 800;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        "GoogleAuth",
        `width=${width},height=${height},top=${top},left=${left}`,
      );

      if (!popup) {
        alert("Popup blocked! Please allow popups and try again.");
        return;
      }

      const checkPopup = setInterval(async () => {
        if (popup.closed) {
          clearInterval(checkPopup);
          console.log("Popup closed");
          let {
            data: { result },
          } = await api.fetchUserDetailById();

          updateUserState({
            is_google_authenticated: result.is_google_authenticated,
          });
        }
      }, 500);
    } catch (error) {
      console.error("handleConnectGoogleDrive Error:", error);
    }
  };

  /**
   * Unset Google authentication by removing Google tokens
   */
  const unsetGoogleAuth = async () => {
    try {
      await updateUser(userId, { google_tokens: null });
      let {
        data: { result },
      } = await api.fetchUserDetailById();
      updateUserState({
        is_google_authenticated: result.is_google_authenticated,
      });
    } catch (error) {
      console.error("unsetGoogleAuth Error:", error);
    }
  };

  /**
   * Handle OneDrive connection
   */
  const handleConnectOneDrive = () => {
    // Implement OneDrive connection
    console.error("handleConnectOneDrive Error:", "Not implemented yet");
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      size="2xl"
      backdrop={true}
      extraClasses="p-0 overflow-hidden max-w-full"
    >
      {/* Modal header */}
      <div className="flex justify-between items-center px-4 py-4 border-b border-gray-200 sm:px-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {translate("settings.title")}
        </h2>
        <button
          onClick={onClose}
          className="p-3 rounded-full transition-colors duration-200 hover:bg-gray-100"
          aria-label="Close"
        >
          <img src={allImgPaths.closeIcon} alt="Close" className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-[550px] overflow-hidden">
        {/* Left sidebar */}
        <div className="overflow-y-auto w-full bg-gray-50 border-r border-gray-200 md:w-72">
          <div className="py-3">
            <div
              className={`flex items-center px-5 py-3 cursor-pointer ${
                activeMenu === "general"
                  ? "bg-primary-50 text-primary-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveMenu("general")}
            >
              <img src={allImgPaths.settings} alt="General" className="mr-3" />
              <span className="font-medium">
                {translate("settings.general")}
              </span>
            </div>
            <div
              className={`flex items-center px-5 py-3 cursor-pointer ${
                activeMenu === "connectedApps"
                  ? "bg-primary-50 text-primary-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveMenu("connectedApps")}
            >
              <img
                src={allImgPaths.connectApp}
                alt="Connected Apps"
                className="mr-3"
              />
              <span className="font-medium">
                {translate("settings.connectedApps")}
              </span>
            </div>
            <div
              className={`flex items-center px-5 py-3 cursor-pointer ${
                activeMenu === "dataControls"
                  ? "bg-primary-50 text-primary-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveMenu("dataControls")}
            >
              <img
                src={allImgPaths.database}
                alt="Data Controls"
                className="mr-3"
              />
              <span className="font-medium">
                {translate("settings.dataControlsMenu")}
              </span>
            </div>
            {HOST.DEPLOYMENT_TYPE === "saas" && (
              <div
                className={`flex items-center px-5 py-3 cursor-pointer ${
                  activeMenu === "security"
                    ? "bg-primary-50 text-primary-700"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setActiveMenu("security")}
              >
                <img
                  src={allImgPaths.security}
                  alt="Security"
                  className="mr-3"
                />
                <span className="font-medium">
                  Security
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right content area */}
        <div className="overflow-y-auto flex-1 px-4 py-4 sm:px-6">
          {activeMenu === "general" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="space-y-5"
            >
              {/* Language setting */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">
                  {translate("settings.language.title")}
                </h4>
                <p className="text-sm text-gray-500">
                  {translate("settings.language.description")}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {SITE_LANGUAGES.map(({ id, key, name }) => (
                    <button
                      key={id}
                      onClick={() => handleLanguageChange(id)}
                      className={`px-4 py-2 rounded-md border ${
                        language === id
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {translate(`settings.language.${key}` as any) || name}
                    </button>
                  ))}
                </div>
              </div>

              <Divider className="bg-gray-200" />

              {/* Date Format setting */}
              <div className="space-y-0">
                <h4 className="font-medium text-gray-700">
                  {translate("settings.dateFormat.title")}
                </h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    {translate("settings.dateFormat.description")}
                  </p>
                  <div className="w-full max-w-xs">
                    <Dropdown
                      listClassName="max-h-56"
                      label={
                        <div className="flex flex-col items-start">
                          <span>
                            {DATE_FORMATS.find(
                              (format) => format.id === date_format,
                            )?.name || DATE_FORMATS[0].name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {translate("settings.dateFormat.example")}:{" "}
                            {DATE_FORMATS.find(
                              (format) => format.id === date_format,
                            )?.example || DATE_FORMATS[0].example}
                          </span>
                        </div>
                      }
                      items={DATE_FORMATS.map((format) => ({
                        ...format,
                        name: (
                          <div className="flex flex-col">
                            <span>{format.name}</span>
                            <span className="text-xs text-gray-500">
                              {translate("settings.dateFormat.example")}:{" "}
                              {format.example}
                            </span>
                          </div>
                        ),
                      }))}
                      selectedItem={DATE_FORMATS.find(
                        (format) => format.id === date_format,
                      )}
                      onSelect={(item) => handleDateFormatChange(item.id)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <Divider className="bg-gray-200" />

              {/* Device logout */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">
                  {translate("settings.session.title")}
                </h4>
                <button
                  onClick={handleLogoutDevice}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <img
                    src={allImgPaths.logout}
                    alt="Logout"
                    className="mr-2 w-5 h-5"
                  />
                  {translate("settings.session.logoutOnThisDevice")}
                </button>
              </div>
            </motion.div>
          )}

          {activeMenu === "connectedApps" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="space-y-3"
            >
              {/* <h3 className="text-lg font-semibold text-gray-800">
                {translate("settings.connectedApps")}
              </h3> */}

              {/* Google Drive */}
              <div className="p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col gap-3 justify-between items-start sm:flex-row sm:items-center sm:gap-0">
                  <div className="flex items-center space-x-3">
                    <img
                      src={allImgPaths.googleDrive}
                      alt="Google Drive"
                      className="w-8 h-8"
                    />
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {translate(
                          "settings.connectedServices.googleDrive.title",
                        )}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {translate(
                          "settings.connectedServices.googleDrive.description",
                        )}
                      </p>
                    </div>
                  </div>
                  {/* <button
                    onClick={handleConnectGoogleDrive}
                    className={`px-4 py-2 text-sm font-medium rounded-md border ${
                      is_google_authenticated
                        ? "text-red-700 bg-white border-red-300 hover:bg-red-50"
                        : "bg-white text-primary-700 border-primary-300 hover:bg-primary-50"
                    }`}
                  >
                    {is_google_authenticated
                      ? translate(
                          "settings.connectedServices.googleDrive.disconnect",
                        )
                      : translate(
                          "settings.connectedServices.googleDrive.connect",
                        )}
                  </button> */}
                  <Tooltip
                    content={translate("common.comingSoon")}
                    className="p-1 text-xs text-white bg-gray-800 rounded-md"
                  >
                    <button
                      onClick={() => {}}
                      className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md border border-gray-300 opacity-50 cursor-not-allowed"
                      disabled
                    >
                      {translate(
                        "settings.connectedServices.microsoftOneDrive.connect",
                      )}
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Microsoft OneDrive */}
              <div className="p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col gap-3 justify-between items-start sm:flex-row sm:items-center sm:gap-0">
                  <div className="flex items-center space-x-3">
                    <img
                      src={allImgPaths.oneDrive}
                      alt="Microsoft OneDrive"
                      className="w-8 h-8"
                    />
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {translate(
                          "settings.connectedServices.microsoftOneDrive.title",
                        )}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {translate(
                          "settings.connectedServices.microsoftOneDrive.description",
                        )}
                      </p>
                    </div>
                  </div>
                  <Tooltip
                    content={translate("common.comingSoon")}
                    className="p-1 text-xs text-white bg-gray-800 rounded-md"
                  >
                    <button
                      onClick={() => {}}
                      className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md border border-gray-300 opacity-50 cursor-not-allowed"
                      disabled
                    >
                      {translate(
                        "settings.connectedServices.microsoftOneDrive.connect",
                      )}
                    </button>
                  </Tooltip>
                </div>
              </div>
            </motion.div>
          )}

          {activeMenu === "dataControls" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="space-y-5"
            >
              {/* Knowledge Entries management */}

              {(role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) && (
                <>
                  <div className="flex flex-col">
                    <div>
                      <h4 className="font-medium text-gray-700">
                        {translate(
                          "settings.dataControlsSection.keManagement.title",
                        )}
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">
                        {translate(
                          "settings.dataControlsSection.keManagement.description",
                        )}
                      </p>

                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {/* Only show delete all KEs button for super admins and admins */}
                        <div className="relative w-full sm:w-auto">
                          <button
                            className={`flex overflow-hidden relative items-center px-4 py-2 text-sm font-medium text-red-700 bg-white rounded-md border border-red-300 duration-300 hover:bg-red-50`}
                            onClick={handleDeleteAllKEs}
                          >
                            <img
                              src={allImgPaths.trash}
                              alt="Delete"
                              className="mr-2 w-5 h-5"
                            />
                            {translate(
                              "settings.dataControlsSection.keManagement.deleteAllKEs",
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Divider className="bg-gray-200" />
                </>
              )}

              {/* Chat management */}
              <div className="flex flex-col">
                <div>
                  <h4 className="font-medium text-gray-700">
                    {translate(
                      "settings.dataControlsSection.chatManagement.title",
                    )}
                  </h4>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    {translate(
                      "settings.dataControlsSection.chatManagement.description",
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <div className="relative w-full sm:w-auto">
                      <button
                        onClick={handleDeleteAllChats}
                        className={`flex overflow-hidden relative items-center px-4 py-2 text-sm font-medium text-red-700 bg-white rounded-md border border-red-300 duration-300 hover:bg-red-50`}
                      >
                        <img
                          src={allImgPaths.trash}
                          alt="Delete"
                          className="mr-2 w-5 h-5"
                        />
                        {translate(
                          "settings.dataControlsSection.chatManagement.deleteAllChats",
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeMenu === "security" && HOST.DEPLOYMENT_TYPE === "saas" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="space-y-5"
            >
              {/* Change Password */}
              <div className="flex flex-col">
                <div>
                  <h4 className="font-medium text-gray-700">
                    Change Password
                  </h4>
                </div>

                <ChangePasswordForm />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Change Password Form Component
const ChangePasswordForm = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { translate } = useTranslate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = translate("auth.changePassword.currentPasswordPlaceholder");
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = translate("auth.errors.passwordRequired");
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = translate("auth.errors.passwordLength");
    } else {
      // Strong password validation
      const hasUpperCase = /[A-Z]/.test(formData.newPassword);
      const hasLowerCase = /[a-z]/.test(formData.newPassword);
      const hasNumbers = /\d/.test(formData.newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}<>|\[\]\/_=+\-]/.test(formData.newPassword);
      
      if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
        newErrors.newPassword = translate("auth.errors.passwordStrength");
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = translate("auth.errors.confirmPasswordRequired");
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = translate("auth.errors.passwordsDoNotMatch");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await authApi.changePassword(
        formData.currentPassword,
        formData.newPassword
      );
      
      console.log('Change password response:', response);
      
      if (response.success) {
        toast.success("Password changed successfully");
        // Reset form after successful password change
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        if (response.data && response.data.errors) {
          toast.error(response.data.errors);
        } else {
          toast.error("Failed to change password. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("Change password error:", error);
      let errorMessage = "Failed to change password. Please try again.";
      
      if (error.response) {
        if (error.response.data && error.response.data.errors) {
          errorMessage = error.response.data.errors;
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-md">
      <div className="relative">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {translate("auth.changePassword.title")}
        </label>
        <div className="relative">
          <input
            type={showCurrentPassword ? "text" : "password"}
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className={`block w-full px-3 py-2 border ${
              errors.currentPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            placeholder={translate("auth.changePassword.currentPasswordPlaceholder")}
          />
          <button
            type="button"
            onClick={toggleCurrentPasswordVisibility}
            className="absolute right-3 top-2 text-gray-500 focus:outline-none"
            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
          >
            <img 
              src={showCurrentPassword ? allImgPaths.eyeIconBlack : allImgPaths.eyeIcon} 
              alt={showCurrentPassword ? "Hide password" : "Show password"}
              className="w-5 h-5"
            />
          </button>
        </div>
        {errors.currentPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
        )}
      </div>

      <div className="relative">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {translate("auth.changePassword.newPasswordPlaceholder")}
        </label>
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className={`block w-full px-3 py-2 border ${
              errors.newPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            placeholder={translate("auth.changePassword.newPasswordPlaceholder")}
          />
          <button
            type="button"
            onClick={toggleNewPasswordVisibility}
            className="absolute right-3 top-2 text-gray-500 focus:outline-none"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            <img 
              src={showNewPassword ? allImgPaths.eyeIconBlack : allImgPaths.eyeIcon} 
              alt={showNewPassword ? "Hide password" : "Show password"}
              className="w-5 h-5"
            />
          </button>
        </div>
        {errors.newPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
        )}
      </div>

      <div className="relative">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {translate("auth.changePassword.confirmPasswordPlaceholder")}
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`block w-full px-3 py-2 border ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
          placeholder={translate("auth.changePassword.confirmPasswordPlaceholder")}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center items-center px-4 py-2 w-full text-sm font-medium text-white bg-primary-600 rounded-md border border-transparent shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <img src={allImgPaths.loader} alt="Loading" className="animate-spin mr-2 w-4 h-4" />
              {translate("auth.changePassword.changingButton")}
            </>
          ) : (
            translate("auth.changePassword.changeButton")
          )}
        </button>
      </div>
    </form>
  );
};

export default SettingsModal;
