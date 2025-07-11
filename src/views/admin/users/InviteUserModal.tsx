import React, { useEffect, useState } from "react";

import inviteApi from "@/apis/invite";
import rolesApi from "@/apis/roles";
import allImgPaths from "@/assets";
import { ButtonV2, Dropdown, Modal, Textarea } from "@/components";
import { useTranslate } from "@/hooks";
import { ROLES } from "@/shared/constants";
import { toast } from "sonner";

interface InviteUserModalProps {
  show: boolean;
  onClose: () => void;
}

interface FailedInvite {
  email: string;
  error: string;
  invitation_id: string | null;
  role: string;
  success: boolean;
}

// This component replicates the InviteUsersStep from the OnboardingFlow
const InviteUserModal: React.FC<InviteUserModalProps> = ({ show, onClose }) => {
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

  // Define the type for role objects
  interface Role {
    id: string;
    _id: string; // Support both id and _id formats from API
    name: string;
  }

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
          // Find a suitable default role (e.g., "Admin" or first available)
          const adminRole = filteredRoles.find(
            (role: Role) => role.name.toUpperCase() === ROLES.ADMIN,
          );
          setSelectedRole(adminRole ? adminRole._id : filteredRoles[0]._id);
        } else {
          setSelectedRole("");
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        setError(translate("onboarding.inviteUsers.failedToLoadRoles"));
      } finally {
        setIsLoading(false);
      }
    };

    if (show) {
      fetchRoles();
    }
  }, [show]);

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
        setRoles(filteredRoles);

        // Set default role if available
        if (filteredRoles.length > 0) {
          // Find a suitable default role (e.g., ADMIN or first available)
          const adminRole = filteredRoles.find(
            (role: Role) => role.name === ROLES.ADMIN,
          );
          setSelectedRole(adminRole ? adminRole._id : filteredRoles[0]._id);
        } else {
          setSelectedRole("");
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

  // Reset form when modal is closed
  useEffect(() => {
    if (!show) {
      setEmailInput("");
      setTempEmails([]);
      setEmailsByRole({});
      setReason("");
      setInvitesSent(false);
      setSuccessCount(0);
      setError("");
    }
  }, [show]);

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

  // Check if an email is already added to any role
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
      setError(translate("onboarding.inviteUsers.somethingWentWrong"));
    } finally {
      setIsSubmitting(false);
      onClose();
      toast.success(translate("onboarding.inviteUsers.invitesSentSuccess"));
    }
  };

  if (isLoading) {
    return (
      <Modal show={show} onClose={onClose} size="lg">
        <div className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-900"></div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      show={show}
      onClose={onClose}
      size="lg"
      extraClasses="!p-0 !border !border-secondary-900 !rounded-2xl sm:w-[750px]"
      className=""
    >
      <div className="border rounded-md shadow-md shadow-secondary-50">
        <div className="pt-6 px-6">
          <h2 className="text-2xl font-bold text-secondary-900 mb-1">
            {translate("onboarding.inviteUsers.title")}
          </h2>
          <p className="text-tertiary-900 mb-6">
            {translate("onboarding.inviteUsers.description")}
          </p>
        </div>
      </div>
      <div className="px-6 pt-8 pb-6">
        <div className="w-full">
          {/* Email and Role Input Section */}
          <div className="flex flex-col sm:flex-row justify-around items-center gap-x-2">
            <div className="flex-grow w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translate("onboarding.inviteUsers.emailAddresses")}
              </label>
              <div className="border border-gray-300 rounded-md p-2 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                <div
                  className="flex flex-wrap gap-2 max-h-24 overflow-y-auto"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {tempEmails.map((email, index) => (
                    <div
                      key={index}
                      className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full flex items-center gap-1"
                    >
                      <span className="text-sm">{email}</span>
                      <button
                        type="button"
                        onClick={() => removeTempEmail(email)}
                        className="text-primary-800 hover:text-primary-900 focus:outline-none"
                      >
                        <img
                          src={allImgPaths.closeIcon}
                          className="h-4 w-4"
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
                    placeholder={translate("onboarding.inviteUsers.emailPlaceholder")}
                  />
                </div>
              </div>
            </div>

            <div className="w-full sm:w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translate("onboarding.inviteUsers.role")}
              </label>
              <Dropdown
                selectedItem={roles.find(
                  (role) => (role._id || role.id) === selectedRole,
                )}
                onSelect={(option: any) =>
                  setSelectedRole(option?._id || option?.id || "")
                }
                items={roles}
                label={
                  roles.find((role) => (role._id || role.id) === selectedRole)
                    ?.name || translate("onboarding.inviteUsers.selectRole")
                }
                className="w-full"
              />
            </div>

            <div className="flex mt-6">
              <ButtonV2
                className="!bg-secondary-900 !text-white !rounded-md !py-2"
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
                      <h4 className="text-sm font-medium text-secondary-900 capitalize">
                        {roleName}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between w-full gap-x-2">
                      <div className="flex gap-2 p-3 border rounded-xl w-full truncate !overflow-x-auto secondary-scrollbar">
                        {emails.map((email, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md flex items-center gap-2 shrink-0"
                          >
                            <span
                              title={email}
                              className="max-w-20 text-sm truncate"
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
                                className="h-2 w-2"
                                alt={translate("onboarding.inviteUsers.removeEmail")}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div>
                        <button
                          onClick={() => removeRoleGroup(roleId)}
                          className="border rounded-md p-4 text-red-600 hover:text-red-800"
                        >
                          <img
                            src={allImgPaths.deleteRedIcon}
                            className="h-5 w-5"
                            alt={translate("onboarding.inviteUsers.removeAllEmails")}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {translate("onboarding.inviteUsers.reason")}
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={translate("onboarding.inviteUsers.reasonPlaceholder")}
            rows={2}
            name="reason"
          />
        </div>

        <div className="flex gap-4">
          {/* Show success message if invites were sent */}
          {invitesSent && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md">
              {translate("onboarding.inviteUsers.successMessage", {
                count: successCount,
              })}
            </div>
          )}
        </div>
      </div>
      <div className="flex w-full gap-4 justify-end border p-6">
        <ButtonV2 variant="tertiaryDark" onClick={onClose}>
          {translate("common.cancel")}
        </ButtonV2>
        <ButtonV2
          rightIcon={allImgPaths.rightArrow}
          className="w-fit !bg-secondary-900 hover:!border-none !text-white !disabled:text-tertiary-400 disabled:bg-tertiary-500"
          onClick={handleSendInvites}
          loading={isSubmitting}
          disabled={Object.keys(emailsByRole).length === 0}
        >
          {translate("onboarding.inviteUsers.sendInvites")}
        </ButtonV2>
      </div>
      
    </Modal>
  );
};

export default InviteUserModal;
