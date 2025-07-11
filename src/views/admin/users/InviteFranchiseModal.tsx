import { InviteFranchiseSchema } from "@/validations";
import { yupResolver } from "@hookform/resolvers/yup";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import companyApi from "@/apis/company";
import rolesApi from "@/apis/roles";
import { ButtonV2, Input, Modal } from "@/components";
import { useTranslate } from "@/hooks";
import { ROLES } from "@/shared/constants";

// Define the type for role objects
interface Role {
  id: string;
  _id: string; // Support both id and _id formats from API
  name: string;
}

interface FormData {
  entityName: string;
  email: string;
  entityDescription: string;
}

interface InviteFranchiseModalProps {
  show: boolean;
  onClose: () => void;
}

// This component allows admins to create a franchise entity and invite a user to manage it
const InviteFranchiseModal: React.FC<InviteFranchiseModalProps> = ({
  show,
  onClose,
}) => {
  const { translate } = useTranslate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      entityName: "",
      email: "",
      entityDescription: "",
    },
    resolver: yupResolver(InviteFranchiseSchema),
    mode: "onChange" as const,
  });

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const { result } = await rolesApi.fetchRoles();

        // Filter out Super_admin role and only keep Admin role
        const filteredRoles = result.filter(
          (role: Role) => role.name === ROLES.ADMIN,
        );
        setRoles(filteredRoles);

        // Set Admin role by default
        if (filteredRoles.length > 0) {
          const adminRole = filteredRoles.find(
            (role: Role) => role.name === ROLES.ADMIN,
          );
          setSelectedRole(adminRole ? adminRole.id : filteredRoles[0].id);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        setError(translate("admin.franchise.failedToLoadRoles"));
      } finally {
        setIsLoading(false);
      }
    };

    if (show) {
      fetchRoles();
    }
  }, [show, translate]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!show) {
      reset();
      setError("");
    }
  }, [show, reset]);

  const onSubmit = async (data: FormData) => {
    if (!selectedRole) {
      setError(translate("admin.franchise.selectRole"));
      return;
    }

    // Clear previous errors
    setError("");

    try {
      // API call to create franchise
      await companyApi.createFranchise({
        entity_name: data.entityName.trim(),
        email: data.email.trim(),
        role: selectedRole,
        entity_description: data.entityDescription?.trim() || "", // Provide empty string if undefined
      });

      // Show success toast and close modal immediately
      toast.success(translate("admin.franchise.inviteSuccess"));
      onClose();
    } catch (error: any) {
      console.error("Error inviting franchise:", error?.response?.data?.errors);
      toast.error(
        error?.response?.data?.errors ||
          translate("admin.franchise.somethingWentWrong"),
      );
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
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            {translate("admin.franchise.inviteTitle")}
          </h2>
          <p className="text-tertiary-900 mb-6">
            {translate("admin.franchise.inviteDescription")}
          </p>
        </div>
      </div>
      <div className="p-6 w-full">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {translate("admin.franchise.franchiseName")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Input
            control={control}
            name="entityName"
            type="text"
            errors={errors}
            placeholder={translate("admin.franchise.franchiseNamePlaceholder")}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {translate("admin.franchise.adminEmail")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Input
            control={control}
            name="email"
            type="email"
            errors={errors}
            placeholder={translate("admin.franchise.adminEmailPlaceholder")}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {translate("admin.franchise.description")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Input
            control={control}
            name="entityDescription"
            type="text"
            errors={errors}
            placeholder={translate("admin.franchise.descriptionPlaceholder")}
            textBoxClasses="min-h-[72px]"
            required
          />
        </div>
      </div>
      <div className="flex w-full gap-4 justify-end border p-6">
        <ButtonV2 variant="tertiaryDark" onClick={onClose}>
          {translate("common.cancel")}
        </ButtonV2>
        <ButtonV2
          className="!bg-secondary-900 !text-white"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || !selectedRole}
          type="submit"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            </div>
          ) : (
            translate("admin.franchise.createButton")
          )}
        </ButtonV2>
      </div>
    </Modal>
  );
};

export default InviteFranchiseModal;
