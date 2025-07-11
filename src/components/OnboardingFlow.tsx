import { get } from "lodash-es";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import authApi from "@/apis/auth";
import companyApi from "@/apis/company";
import companyAuthApi from "@/apis/companyAuth";
import inviteApi from "@/apis/invite";
import onboardingApi from "@/apis/onboarding";
import rolesApi from "@/apis/roles";
import userMembershipsApi, {
  Company as ApiCompany,
} from "@/apis/userMemberships";
import usersApi from "@/apis/users";
import allImgPaths from "@/assets";
import {
  ButtonV2,
  Dropdown,
  Label,
  SelectComponent,
  Textarea,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { DATE_FORMATS, ROLES, SITE_LANGUAGES } from "@/shared/constants";
import AuthLayout from "./layout/AuthLayout";

interface OnboardingFlowProps {
  show: boolean;
}

interface CreateCompanyStepProps {
  onNext: () => void;
  onBack?: () => void;
}

interface InviteUsersStepProps {
  onNext: () => void;
}

interface SetPreferencesStepProps {
  onComplete: () => void;
}

interface CompanyListingStepProps {
  onCreateNew: () => void;
  setAutoSelecting: (value: boolean) => void;
}

interface Role {
  id: string;
  _id: string; // Support both id and _id formats from API
  name: string;
}

interface FailedInvite {
  email: string;
  error: string;
  invitation_id: string | null;
  role: string;
  success: boolean;
}

// Component for the Create Company step
const CreateCompanyStep: React.FC<CreateCompanyStepProps> = ({
  onNext,
  onBack,
}) => {
  const { translate } = useTranslate();
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!companyName) return;

    setIsSubmitting(true);
    setError("");
    try {
      // API call to create company
      const response = await companyApi.createCompany({
        name: companyName,
        domain: companyName, // Default domain
      });
      console.log("🚀 ~ handleSubmit ~ response:", response);

      // Extract company details from the response
      const companyData = response?.data?.result || response;

      if (
        companyData?.id &&
        companyData?.entity_id &&
        companyData?.membership_id
      ) {
        // Store company information in localStorage
        localStorage.setItem("selected_company_id", companyData.id);
        localStorage.setItem("selected_company_name", companyName);

        // Call get-entity-token API to update the token with company context
        try {
          const success = await companyAuthApi.getEntityToken(
            companyData.id,
            companyData.entity_id,
            companyData.membership_id,
          );

          if (!success) {
            console.warn(
              "Failed to get entity token, but continuing onboarding flow",
            );
          }
        } catch (tokenError) {
          // Silent fail - don't interrupt the user flow if token update fails
          console.error("Error getting entity token:", tokenError);
        }
      } else {
        console.warn(
          "Company created but missing required fields for token update",
          companyData,
        );
      }

      // Update onboarding step
      await onboardingApi.updateOnboardingStep({
        current_step: "invite_users",
      });

      onNext();
    } catch (error: any) {
      console.error("Error creating company:", error);
      setError(error?.response?.data?.errors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-6 pt-6 bg-white rounded-t-3xl border-t border-r-0 border-b-0 border-l-0 border-t-primary-100">
      <h2 className="mb-1 text-base sm:text-2xl font-bold text-secondary-900">
        {translate("onboarding.createCompany.title")}
      </h2>
      <p className="mb-6 text-xs sm:text-base sm:text-tertiary-900">
        {translate("onboarding.createCompany.description")}
      </p>

      {error && (
        <div className="p-3 mb-4 text-red-700 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block mb-1 text-base font-medium text-gray-700">
          {translate("onboarding.createCompany.companyName")}
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={translate(
            "onboarding.createCompany.companyNamePlaceholder",
          )}
        />
      </div>

      <div className="flex justify-center gap-x-1">
        {onBack && (
          <ButtonV2
            leftIcon={allImgPaths.leftArrow}
            className="!bg-white !text-secondary-900 !w-1/2 border border-tertiary-400"
            onClick={onBack}
            disabled={isSubmitting}
          >
            {translate("common.back") || "Back"}
          </ButtonV2>
        )}
        <ButtonV2
          rightIcon={allImgPaths.rightArrow}
          className="!w-1/2"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!companyName}
        >
          {translate("onboarding.createCompany.continue")}
        </ButtonV2>
      </div>
    </div>
  );
};

// Component for the Invite Users step
const InviteUsersStep: React.FC<InviteUsersStepProps> = ({ onNext }) => {
  const { translate } = useTranslate();
  const [emailInput, setEmailInput] = useState("");
  const [tempEmails, setTempEmails] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [reason, setReason] = useState("");
  // Track if invites have been sent successfully
  const [invitesSent, setInvitesSent] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  // Store emails grouped by role
  const [emailsByRole, setEmailsByRole] = useState<Record<string, string[]>>(
    {},
  );

  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const { result } = await rolesApi.fetchRoles();

        // Filter out Super_admin role
        const filteredRoles = result.filter(
          (role: Role) => role.name !== ROLES.SUPER_ADMIN,
        );
        const rolesToDisplay = filteredRoles.map((role: Role) => ({
          ...role,
          name: role.name
            .toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        }));
        setRoles(rolesToDisplay);

        // Set default role if available
        if (filteredRoles.length > 0) {
          // Find a suitable default role (e.g., ADMIN or first available)
          const adminRole = filteredRoles.find(
            (role: Role) => role.name === ROLES.ADMIN,
          );
          setSelectedRole(adminRole ? adminRole._id : filteredRoles[0]._id);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        setError(translate("onboarding.inviteUsers.failedToLoadRoles"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Handle adding email pills when user types comma, space, or tab
  const handleEmailInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // Check if the key is comma, space, or tab
    if (e.key === "," || e.key === " " || e.key === "Tab") {
      e.preventDefault();
      addEmailPill();
    }
  };

  // Check if email already exists in any role group
  const isEmailAlreadyAdded = (email: string): boolean => {
    return Object.values(emailsByRole).some((emails) => emails.includes(email));
  };

  // Add email pill from current input
  const addEmailPill = () => {
    const email = emailInput.trim();
    if (
      email &&
      isValidEmail(email) &&
      !tempEmails.includes(email) &&
      !isEmailAlreadyAdded(email)
    ) {
      setTempEmails([...tempEmails, email]);
      setEmailInput("");
      setError("");
    } else if (email && !isValidEmail(email)) {
      setError(
        translate("onboarding.inviteUsers.errorMessages.invalidEmail", {
          email,
        }),
      );
    } else if (email && isEmailAlreadyAdded(email)) {
      setError(
        translate("onboarding.inviteUsers.errorMessages.duplicateEmail", {
          email,
        }),
      );
    }
  };

  // Remove email from temporary list
  const removeTempEmail = (emailToRemove: string) => {
    setTempEmails(tempEmails.filter((email) => email !== emailToRemove));
  };

  // Add emails to a role group
  const addEmailsToRole = () => {
    if (tempEmails.length === 0 || !selectedRole) return;

    setEmailsByRole((prev) => {
      const updatedEmails = { ...prev };
      // If role already exists, add to existing array, otherwise create new array
      if (updatedEmails[selectedRole]) {
        updatedEmails[selectedRole] = [
          ...updatedEmails[selectedRole],
          ...tempEmails,
        ];
      } else {
        updatedEmails[selectedRole] = [...tempEmails];
      }
      return updatedEmails;
    });

    // Clear temporary emails after adding to role
    setTempEmails([]);
    setError("");
    setSelectedRole("");
  };

  // Remove email from a role group
  const removeEmailFromRole = (roleId: string, emailToRemove: string) => {
    setEmailsByRole((prev) => {
      const updatedEmails = { ...prev };
      updatedEmails[roleId] = updatedEmails[roleId].filter(
        (email) => email !== emailToRemove,
      );

      // If no emails left for this role, remove the role entry
      if (updatedEmails[roleId].length === 0) {
        delete updatedEmails[roleId];
      }

      return updatedEmails;
    });
  };

  // Remove entire role group
  const removeRoleGroup = (roleId: string) => {
    setEmailsByRole((prev) => {
      const updatedEmails = { ...prev };
      delete updatedEmails[roleId];
      return updatedEmails;
    });
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle blur event to add any remaining email
  const handleEmailInputBlur = () => {
    if (emailInput.trim()) {
      addEmailPill();
    }
  };

  const handleSendInvites = async () => {
    // Check if there are any emails to send
    const totalEmailCount = Object.values(emailsByRole).reduce(
      (count, emails) => count + emails.length,
      0,
    );

    if (totalEmailCount === 0) {
      setError(translate("onboarding.inviteUsers.errorMessages.noEmails"));
      return;
    }

    // Add any remaining email in the input field to the current selected role
    if (emailInput.trim() && selectedRole) {
      addEmailPill();
      if (tempEmails.length > 0) {
        addEmailsToRole();
      }
    }

    setIsSubmitting(true);
    setError("");
    try {
      // Prepare invite payload from all role groups
      const invitePayload: Array<{
        email: string;
        role: string;
        reason_for_request: string;
      }> = [];

      // Convert emailsByRole to the format expected by the API
      Object.entries(emailsByRole).forEach(([roleId, emails]) => {
        emails.forEach((email) => {
          invitePayload.push({
            email,
            role: roleId,
            reason_for_request: reason,
          });
        });
      });

      if (invitePayload.length === 0) {
        setError(
          translate("onboarding.inviteUsers.errorMessages.noValidEmails"),
        );
        setIsSubmitting(false);
        return;
      }

      // Send invites
      const inviteResponse = await inviteApi.sendInvites(invitePayload);

      // Check for failed invites
      const failedInvites = inviteResponse?.data?.result?.failed_invites || [];
      const successfulInvites =
        inviteResponse?.data?.result?.successful_invites || [];

      if (failedInvites.length > 0) {
        // Create error message for failed invites
        const errorMessages = failedInvites.map((invite: FailedInvite) => {
          return `${invite.email}: ${invite.error}`;
        });

        // If all invites failed, show error
        if (successfulInvites.length === 0) {
          setError(
            translate("onboarding.inviteUsers.errorMessages.allFailed", {
              errors: errorMessages.join(", "),
            }),
          );
        } else {
          // If some invites succeeded, show warning
          setError(
            translate("onboarding.inviteUsers.errorMessages.someFailed", {
              errors: errorMessages.join(", "),
              count: successfulInvites.length,
            }),
          );
          setInvitesSent(true);
          setSuccessCount(successfulInvites.length);
        }
      } else if (successfulInvites.length > 0) {
        // All invites succeeded
        setError("");
        setInvitesSent(true);
        setSuccessCount(successfulInvites.length);
      }
    } catch (error) {
      console.error("Error sending invites:", error);
      setError(translate("onboarding.inviteUsers.errorMessages.sendFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      // Update onboarding step
      await onboardingApi.updateOnboardingStep({
        current_step: "set_preferences",
      });

      onNext();
    } catch (error) {
      console.error("Error updating onboarding step:", error);
      setError(
        translate("onboarding.inviteUsers.errorMessages.nextStepFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 animate-spin border-primary-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-t-3xl border-t border-r-0 border-b-0 border-l-0 border-t-primary-100">
      <h2 className="mb-1 text-lg sm:text-2xl font-bold text-secondary-900">
        {translate("onboarding.inviteUsers.title")}
      </h2>
      <p className="mb-6 text-xs sm:text-lg text-tertiary-900">
        {translate("onboarding.inviteUsers.description")}
      </p>

      {error && (
        <div className="p-3 mb-4 text-red-700 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <div className="w-full">
        {/* Email and Role Input Section */}
        <div className="flex flex-col gap-x-4 justify-around items-start mb-6 sm:flex-row">
          <div className="flex-grow mb-4 w-full sm:w-auto sm:mb-0">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              {translate("onboarding.inviteUsers.emailAddresses")}
            </label>
            <div className="p-3 rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
              <div
                className="flex overflow-y-auto flex-wrap gap-2 max-h-24"
                style={{ scrollbarWidth: "thin" }}
              >
                {tempEmails.map((email, index) => (
                  <div
                    key={index}
                    className="flex gap-1 items-center px-2 py-1 rounded-full bg-primary-100 text-primary-800"
                  >
                    <span className="text-sm">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeTempEmail(email)}
                      className="text-primary-800 hover:text-primary-900 focus:outline-none"
                    >
                      <img
                        src={allImgPaths.closeIcon}
                        className="w-4 h-4"
                        alt={translate("onboarding.inviteUsers.removeEmail")}
                      />
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailInputKeyDown}
                  onBlur={handleEmailInputBlur}
                  className="flex-grow border-none focus:outline-none focus:ring-0 min-w-[100px]"
                  placeholder={translate(
                    "onboarding.inviteUsers.emailPlaceholder",
                  )}
                />
              </div>
            </div>
          </div>

          <div className="w-full sm:w-48">
            <Label>{translate("onboarding.inviteUsers.role")}</Label>
            <SelectComponent
              value={roles.find(
                (role) => (role._id || role.id) === selectedRole,
              )}
              isLoading={false}
              name="role"
              placeholder={translate("onboarding.inviteUsers.selectRole")}
              options={roles}
              closeMenuOnSelect={true}
              getOptionLabel={(option: any) => option.name}
              getOptionValue={(option: any) => option._id || option.id}
              onChange={(selectedOption: any) => {
                if (selectedOption) {
                  setSelectedRole(
                    selectedOption._id || selectedOption.id || "",
                  );
                } else {
                  setSelectedRole("");
                }
              }}
            />
          </div>

          <div className="flex items-end h-[38px] sm:h-[48px] mt-[22px] sm:mt-[24px]">
            <ButtonV2
              className="!bg-secondary-900 !text-white !rounded-md h-full text-xs sm:text-base"
              onClick={addEmailsToRole}
              disabled={tempEmails.length === 0 || !selectedRole}
            >
              {translate("onboarding.inviteUsers.addButton")}
            </ButtonV2>
          </div>
        </div>

        <div>
          {/* Role Groups Display */}
          {Object.entries(emailsByRole).map(([roleId, emails]) => {
            const roleName =
              roles.find((r) => (r._id || r.id) === roleId)?.name || roleId;
            return (
              <>
                <div key={roleId} className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium capitalize text-secondary-900">
                      {roleName}
                    </h4>
                  </div>
                  <div className="flex gap-x-2 justify-between items-center w-full">
                    <div className="flex gap-2 p-3 border rounded-xl w-full truncate !overflow-x-auto secondary-scrollbar">
                      {emails.map((email, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2 items-center px-3 py-1 text-gray-800 bg-gray-100 rounded-md shrink-0"
                        >
                          <span
                            title={email}
                            className="text-sm truncate max-w-20"
                          >
                            {email}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeEmailFromRole(roleId, email)}
                            className="text-gray-600 hover:text-gray-900 focus:outline-none"
                          >
                            <img
                              src={allImgPaths.closeIcon}
                              className="w-2 h-2"
                              alt={translate(
                                "onboarding.inviteUsers.removeEmail",
                              )}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <button
                        onClick={() => removeRoleGroup(roleId)}
                        className="h-11 sm:h-auto w-11 flex sm:flex-none items-center justify-center sm:w-auto sm:p-4 text-red-600 rounded-md border hover:text-red-800"
                      >
                        <img
                          src={allImgPaths.deleteRedIcon}
                          className="w-5 h-5 shrink-0"
                          alt={translate(
                            "onboarding.inviteUsers.removeAllEmails",
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            );
          })}
        </div>
      </div>

      <div className="my-4">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {translate("onboarding.inviteUsers.reason")}
        </label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={translate("onboarding.inviteUsers.reasonPlaceholder")}
          rows={2}
          name="reason"
          className="max-h-[120px] !min-h-[60px]"
        />
      </div>

      {/* Show success message if invites were sent */}
      {invitesSent && (
        <div className="p-3 text-green-700 bg-green-50 rounded-md my-2">
          {translate("onboarding.inviteUsers.successMessage", {
            count: successCount,
          })}
        </div>
      )}
      <div className="flex gap-4">
        <ButtonV2
          rightIcon={allImgPaths.rightArrow}
          className="w-full !bg-secondary-900 hover:!border-none !text-white !disabled:text-tertiary-400 disabled:bg-tertiary-500 text-xs sm:text-base"
          onClick={handleSendInvites}
          loading={isSubmitting}
          disabled={Object.keys(emailsByRole).length === 0}
        >
          {translate("onboarding.inviteUsers.sendInvites")}
        </ButtonV2>

        <ButtonV2
          rightIcon={allImgPaths.rightArrow}
          variant={invitesSent ? "primary" : "secondary"}
          className="w-full !border-primary-900 !bg-primary-900 hover:!bg-secondary-900 hover:!border-none !text-white !disabled:text-tertiary-400 disabled:bg-tertiary-500 text-xs sm:text-base"
          onClick={handleContinue}
        >
          {translate("onboarding.inviteUsers.continueToNextStep")}
        </ButtonV2>
      </div>
    </div>
  );
};

// Component for the Set Preferences step
const SetPreferencesStep: React.FC<SetPreferencesStepProps> = ({
  onComplete,
}) => {
  const { translate } = useTranslate();
  const [language, setLanguage] = useState("en");
  const [dateFormat, setDateFormat] = useState("Do MMM, YYYY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      // API call to save preferences
      await usersApi.updateUserPreferences({
        language,
        date_format: dateFormat,
      });

      // Mark onboarding as complete
      await onboardingApi.updateOnboardingStep({
        current_step: "onboarding_complete",
      });

      // Directly navigate to dashboard using window.location.href
      // This ensures immediate navigation with a full page refresh
      window.location.href = "/chats";
    } catch (error) {
      console.error("Error updating preferences:", error);
      setError(translate("onboarding.setPreferences.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-t-3xl border-t border-r-0 border-b-0 border-l-0 border-t-primary-100">
      <h2 className="mb-4 text-base sm:text-2xl font-bold text-secondary-900">
        {translate("onboarding.setPreferences.title")}
      </h2>
      <p className="mb-6 text-tertiary-900 text-xs sm:text-base">
        {translate("onboarding.setPreferences.description")}
      </p>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {translate("onboarding.setPreferences.language")}
        </label>
        <div className="w-full">
          <Dropdown
            listClassName="max-h-56"
            label={
              <div className="flex flex-col items-start">
                <span>
                  {SITE_LANGUAGES.find((lang) => lang.id === language)?.name ||
                    SITE_LANGUAGES[0].name}
                </span>
              </div>
            }
            items={SITE_LANGUAGES}
            selectedItem={SITE_LANGUAGES.find((lang) => lang.id === language)}
            onSelect={(item) => setLanguage(item.id)}
            className="w-full"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {translate("onboarding.setPreferences.dateFormat")}
        </label>
        <div className="w-full">
          <Dropdown
            listClassName="max-h-56"
            label={
              <div className="flex flex-col items-start">
                <span>
                  {DATE_FORMATS.find((format) => format.id === dateFormat)
                    ?.name || DATE_FORMATS[0].name}
                </span>
                <span className="text-xs text-gray-500">
                  {translate("settings.dateFormat.example")}:{" "}
                  {DATE_FORMATS.find((format) => format.id === dateFormat)
                    ?.example || DATE_FORMATS[0].example}
                </span>
              </div>
            }
            items={DATE_FORMATS.map((format) => ({
              ...format,
              name: (
                <div className="flex flex-col">
                  <span>{format.name}</span>
                  <span className="text-xs text-gray-500">
                    {translate("settings.dateFormat.example")}: {format.example}
                  </span>
                </div>
              ),
            }))}
            selectedItem={DATE_FORMATS.find(
              (format) => format.id === dateFormat,
            )}
            onSelect={(item) => setDateFormat(item.id)}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex justify-center w-full">
        <ButtonV2
          rightIcon={allImgPaths.rightArrow}
          className="!w-1/2 text-xs sm:text-base"
          onClick={handleSubmit}
          loading={isSubmitting}
        >
          {translate("onboarding.setPreferences.completeSetup")}
        </ButtonV2>
      </div>
    </div>
  );
};

// Full-page loader component for automatic company selection
const FullPageLoader: React.FC<{ message?: string }> = ({ message }) => {
  const { translate } = useTranslate();
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col justify-center items-center">
      <div className="w-16 h-16 rounded-full border-t-4 border-b-4 animate-spin border-secondary-900 mb-6"></div>
    </div>
  );
};

// Component for the Company Listing step
const CompanyListingStep: React.FC<CompanyListingStepProps> = ({
  onCreateNew,
  setAutoSelecting,
}) => {
  const { translate } = useTranslate();
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  console.log("🚀 ~ companies:", companies);
  const [loading, setLoading] = useState(true);
  const [selectingCompany, setSelectingCompany] = useState(false);

  useEffect(() => {
    setAutoSelecting(true);
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      // Fetch companies from API
      const companies = await userMembershipsApi.getUserMemberships();
      setCompanies(companies);

      // Auto-select if there's only one company
      if (companies.length === 1) {
        console.log(
          "Only one company found, selecting automatically:",
          companies[0],
        );
        // Set auto-selecting state to show full-page loader
        setAutoSelecting(true);
        setLoading(false); // Hide the regular loading indicator
        // Handle company selection immediately
        handleCompanySelect(companies[0]);
        return;
      }
      setAutoSelecting(false);
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      toast.error(error.response?.data?.message || "Failed to load companies");
      setAutoSelecting(false);
    } finally {
      // Only set loading to false if we're not auto-selecting
      if (!(companies?.length === 1)) {
        setLoading(false);
      }
    }
  };

  const handleCompanySelect = async (company: ApiCompany) => {
    try {
      setSelectingCompany(true);

      if (!company.membership_id || !company.entity_id) {
        toast.error("Missing required company information");
        return;
      }

      // Get entity token for the selected company
      const success = await companyAuthApi.getEntityToken(
        company.id,
        company.entity_id,
        company.membership_id,
      );

      if (success) {
        // Store selected company information in localStorage
        localStorage.setItem("selected_company_id", company.id);
        localStorage.setItem("selected_company_name", company.name);

        // Store role if available
        if (company.role) {
          localStorage.setItem("selected_company_role", company.role);
        }

        // Fetch user details with the new token before navigating
        try {
          const userDetailResponse = await authApi.fetchUserDetailById();

          // Update any additional user information if needed
          if (userDetailResponse?.data?.result) {
            const userData = userDetailResponse.data.result;
            // Store any additional user data from the response
            if (userData.preferences) {
              localStorage.setItem(
                "user_preferences",
                JSON.stringify(userData.preferences),
              );
            }
          }

          // Use direct window location change instead of React Router navigation
          window.location.href = "/chats";
        } catch (userDetailError) {
          console.error(
            "Error fetching user details after company selection:",
            userDetailError,
          );
          toast.error("Failed to load user details. Please try again.");
          setSelectingCompany(false);
        }
      } else {
        toast.error("Failed to select company. Please try again.");
        setSelectingCompany(false);
      }
    } catch (error: any) {
      console.error("Error selecting company:", error);
      toast.error(error.response?.data?.message || "Failed to select company");
      setSelectingCompany(false);
    }
  };

  return (
    <>
      <div className="px-6 pt-6 bg-white rounded-t-3xl border-t border-r-0 border-b-0 border-l-0 border-t-primary-100">
        <h2 className="mb-1 text-2xl font-bold text-secondary-900">
          {translate("onboarding.companyListing.title") ||
            "Select Your Company"}
        </h2>
        <p className="mb-6 text-tertiary-900">
          {translate("onboarding.companyListing.description") ||
            "Select an existing company or create a new one"}
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 rounded-full border-t-2 border-b-2 animate-spin border-secondary-900"></div>
          </div>
        ) : selectingCompany ? (
          <div className="flex flex-col justify-center items-center h-40">
            <div className="w-12 h-12 rounded-full border-t-2 border-b-2 animate-spin border-secondary-900 mb-4"></div>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-80 overflow-y-auto mb-6">
              {companies.length > 0 ? (
                companies.map((company) => (
                  <div
                    key={company.id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                    onClick={() => handleCompanySelect(company)}
                    aria-disabled={selectingCompany}
                    style={{ opacity: selectingCompany ? 0.7 : 1 }}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {company.name}
                      </p>
                      {/* {company.entity_id && (
                        <p className="text-sm text-gray-600">
                          {company.role || "Member"}
                        </p>
                      )} */}
                    </div>
                    <div className="text-primary-700">
                      <img src={allImgPaths.chevronRight} alt="chevron-right" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {translate("onboarding.companyListing.noCompanies") ||
                    "No companies found"}
                </div>
              )}
            </div>
            {/* <div className="flex items-center justify-center mb-6">
            <Divider className="w-1/2 mx-2" />
            <span className="text-gray-500">or</span>
            <Divider className="w-1/2 mx-2" />
          </div>
          <div className="flex justify-center">
            <ButtonV2
              rightIcon={allImgPaths.rightArrow}
              className="!w-1/2 !bg-white !text-secondary-900"
              onClick={onCreateNew}
            >
              {translate("onboarding.companyListing.createNew") ||
                "Create a new company"}
            </ButtonV2>
          </div> */}
          </>
        )}
      </div>
    </>
  );
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ show }) => {
  const { user, updateUserState, logout } = useAppState(RootState.AUTH);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSelecting, setAutoSelecting] = useState(false);
  const { translate } = useTranslate();
  const { i18n } = useTranslation();

  const onboardingData = user?.preferences?.onboarding;
  const showCompanyListing = user?.show_company_listing === true;

  useEffect(() => {
    if (
      showCompanyListing &&
      (!onboardingData?.currentStep ||
        onboardingData?.currentStep === "create_company")
    ) {
      // If show_company_listing is true and we're at the beginning of onboarding, show company listing step
      setCurrentStep("company_listing");
    } else if (onboardingData?.currentStep) {
      setCurrentStep(onboardingData.currentStep);
    }
  }, [onboardingData, showCompanyListing]);

  const handleNextStep = async () => {
    setIsLoading(true);
    try {
      // Refresh user data to get updated onboarding state
      const {
        data: { result },
      } = await usersApi.getUserDetailById();
      updateUserState({ preferences: result.preferences });
    } catch (error) {
      console.error("Error fetching updated user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for transitioning from company listing to create company step
  const handleCreateNew = () => {
    setCurrentStep("create_company");
  };

  // Handler for going back from create company to company listing step
  const handleBackToCompanyListing = () => {
    setCurrentStep("company_listing");
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Refresh user data to confirm onboarding is complete
      const {
        data: { result },
      } = await usersApi.getUserDetailById();

      // update i18n language
      i18n.changeLanguage(get(result, "preferences.language", "en"));

      updateUserState({ preferences: result.preferences });

      // Use window.location.href to navigate to dashboard after completion
      // This ensures a full page refresh with the updated token and user state
      window.location.href = "/chats";
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use useMemo to get the component based on current step
  const stepComponent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-10">
          <div className="w-12 h-12 rounded-full border-t-2 border-b-2 animate-spin border-primary-900"></div>
        </div>
      );
    }

    switch (currentStep) {
      case "company_listing":
        return (
          <CompanyListingStep
            onCreateNew={handleCreateNew}
            setAutoSelecting={setAutoSelecting}
          />
        );
      case "create_company":
        return (
          <CreateCompanyStep
            onNext={handleNextStep}
            onBack={showCompanyListing ? handleBackToCompanyListing : undefined}
          />
        );
      case "invite_users":
        return <InviteUsersStep onNext={handleNextStep} />;
      case "set_preferences":
        return <SetPreferencesStep onComplete={handleComplete} />;
      default:
        return (
          <div className="p-6 text-center">
            <p>{translate("onboarding.loading")}</p>
          </div>
        );
    }
  }, [
    currentStep,
    isLoading,
    handleNextStep,
    handleComplete,
    handleCreateNew,
    handleBackToCompanyListing,
    showCompanyListing,
  ]);

  // Show stepper component
  const renderStepper = () => {
    // Hide stepper if current step is company_listing
    if (!onboardingData || currentStep === "company_listing") return null;

    // Use the onboarding steps from constants
    const currentStepNumber = onboardingData.currentStepNumber || 1;

    // Define step data with labels and icons
    const steps = [
      {
        id: "create_company",
        label: translate("onboarding.createCompany.title"),
        icon: (isActive: boolean) => (
          <span
            className={`flex justify-center items-center p-2 w-12 h-12 rounded-full ${isActive ? "block" : "hidden sm:block"}`}
          >
            <img
              src={
                isActive
                  ? allImgPaths.companyActive
                  : allImgPaths.companyInactive
              }
              alt={translate("onboarding.createCompany.title")}
              width="40"
              height="40"
            />
          </span>
        ),
      },
      {
        id: "invite_users",
        label: translate("onboarding.inviteUsers.title"),
        icon: (isActive: boolean) => (
          <span
            className={`flex justify-center items-center p-2 w-12 h-12 rounded-full ${isActive ? "block" : "hidden sm:block"}`}
          >
            <img
              src={
                isActive ? allImgPaths.inviteActive : allImgPaths.inviteInactive
              }
              alt={translate("onboarding.inviteUsers.title")}
              width="40"
              height="40"
            />
          </span>
        ),
      },
      {
        id: "set_preferences",
        label: translate("onboarding.setPreferences.title"),
        icon: (isActive: boolean) => (
          <span
            className={`flex justify-center items-center p-2 w-12 h-12 rounded-full ${isActive ? "block" : "hidden sm:block"}`}
          >
            <img
              src={
                isActive
                  ? allImgPaths.preferenceActive
                  : allImgPaths.preferenceInactive
              }
              alt={translate("onboarding.setPreferences.title")}
              width="40"
              height="40"
            />
          </span>
        ),
      },
    ];

    return (
      <div className="px-6 pt-6 pb-4">
        <div className="flex justify-between items-center w-full">
          {steps.map((step, index) => {
            const isActive = index < currentStepNumber;
            const isCurrentStep = index === currentStepNumber - 1;

            return (
              <React.Fragment key={step.id}>
                {/* Step with icon and label */}
                <div
                  className={`flex flex-col items-center ${isCurrentStep ? "block" : "hidden"} sm:block`}
                >
                  <div className="flex items-center">
                    <div
                      className={`${isActive ? "opacity-100" : "opacity-50"}`}
                    >
                      {step.icon(isActive)}
                      {/* Call the icon function with isActive */}
                    </div>
                    <span
                      className={`text-sm w-fit text-left font-semibold ${isCurrentStep ? "text-primary-700 block" : isActive ? "text-gray-700 block" : "text-gray-400 hidden sm:block"}`}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>

                {/* Connector line between steps */}
                {index < steps.length - 1 && (
                  <div className="md:w-[30%] w-[50%]  mx-2 h-[1px] bg-gray-300 hidden sm:block">
                    <div
                      className="h-full transition-all duration-300 bg-primary-500"
                      style={{ width: isActive ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // Temporary logout button component
  const TemporaryLogoutButton = () => {
    // Only show the button if localStorage has showdelete=true
    const showDeleteButton = localStorage.getItem("showDelete") === "true";

    if (!showDeleteButton) return null;

    return (
      <div className="px-6 pb-4 mt-2">
        <div className="pt-4 border-t border-gray-200">
          <ButtonV2
            variant="error"
            className="flex gap-2 justify-center items-center w-full"
            onClick={() => logout()}
          >
            <img src={allImgPaths.logout} alt="Logout" className="w-4 h-4" />
            Temporary: Logout
          </ButtonV2>
          <p className="mt-2 text-xs text-center text-gray-500">
            This button is for testing purposes only
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={`${show ? "block" : "hidden"}`}>
      {/* Full-page loader for automatic company selection */}
      {autoSelecting && <FullPageLoader />}

      <AuthLayout className="!max-w-[90%] !max-h-[90%] pb-8">
        <div className="rounded-2xl bg-secondary-200">
          {renderStepper()}
          {stepComponent}
        </div>
        <TemporaryLogoutButton />
      </AuthLayout>
    </div>
  );
};

export default OnboardingFlow;
