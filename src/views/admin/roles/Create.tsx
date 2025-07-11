import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

import allImgPaths from "@/assets";
import {
  ButtonV2,
  Checkbox,
  DrawerFooter,
  Input,
  LoaderCircle,
  Textarea,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { RoleSchema } from "@/validations";
import {
  chain,
  find,
  get,
  has,
  intersection,
  map,
  sortBy,
  without,
} from "lodash-es";

const Create = ({ onClose }: { onClose: () => void }) => {
  const [permissionsList, setPermissionsList] = useState([]);

  const location = useLocation();
  const { translate } = useTranslate();

  const {
    fetchRoleById,
    updateRole,
    createRole,
    fetchRolePermission,
    isFetchingPermission,
    isFetching,
    isUpdating,
    isCreating,
  } = useAppState(RootState.ROLES);

  const {
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
    mode: "onChange",
    resolver: yupResolver(RoleSchema),
  });

  const queryParams = new URLSearchParams(location.search);
  const roleId = queryParams.get("roleId");

  const fetchRole = async (roleId: string) => {
    try {
      const result = await fetchRoleById(roleId);

      setValue("name", result.name, { shouldValidate: true });
      setValue("description", result.description, { shouldValidate: true });
      setValue("permissions", map(result.permissions, "id"), {
        shouldValidate: true,
      });
    } catch (error) {
      console.error("fetchRole error =>", error);
    }
  };

  const fetchPermission = async () => {
    try {
      let result = await fetchRolePermission();

      result = result.map((obj: any) => {
        if (has(obj, "permissions")) {
          obj.permissions = sortBy(obj.permissions, (permission) => {
            const name = permission.name;

            if (/^view_/i.test(name)) return 1; // View comes first
            if (/^create_/i.test(name)) return 2; // Create comes second
            if (/^update_/i.test(name)) return 3; // Update comes third
            if (/^delete_/i.test(name)) return 4; // Delete comes last

            return 5; // Default (if no match)
          });
        }
        return obj;
      });

      setPermissionsList(result);
    } catch (error) {
      toast.error(`Something went wrong while fetching permission list`, {
        id: "permission-fetch-error",
      });
      console.error("fetchPermission error =>", error);
    }
  };

  useEffect(() => {
    if (!roleId) {
      fetchPermission();
    }
  }, []);

  useEffect(() => {
    if (roleId) {
      fetchRole(roleId).then(() => {
        fetchPermission();
      });
    }
  }, [roleId]);

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
    };

    try {
      if (roleId) {
        const { data } = await updateRole(roleId, payload);

        toast.success(
          get(data, "result.message", "Role updated successfully"),
          {
            id: "success-role-updated",
          },
        );
      } else {
        const { data } = await createRole(payload);

        toast.success(
          get(data, "result.message", "Role created successfully"),
          {
            id: "success-role-added",
          },
        );
      }
      onClose();
    } catch (error) {
      const err = get(
        error,
        "response.data.errors.error",
        "Something went wrong, please try after sometime",
      );
      toast.error(err);
    }
  };

  const isChecked = (action: any, data: any) => {
    const { id, name } = action;
    const currentAction = name.split("_")[0];

    const { permissions } = watch();

    const pagePermissions = data.permissions;

    const CUDIds = chain(pagePermissions)
      .filter((permission) => /delete|update|create/i.test(permission.name))
      .map("id")
      .value();

    const hasIntersection = intersection(permissions, CUDIds).length > 0;

    if (hasIntersection && currentAction === "view") {
      return true;
    } else {
      return permissions.includes(id);
    }
  };

  const isDisabled = (action: any, data: any) => {
    const { name } = action;
    const currentAction = name.split("_")[0];

    const { permissions } = watch();

    const pagePermissions = data.permissions;

    const CUDIds = chain(pagePermissions)
      .filter((permission) => /delete|update|create/i.test(permission.name))
      .map("id")
      .value();

    const hasIntersection = intersection(permissions, CUDIds).length > 0;

    return hasIntersection && currentAction === "view";
  };

  const onChangePermission = (action: any, data: any) => {
    const { id, name }: { id: string; name: string } = action;
    const currentAction = name.split("_")[0];

    const actionList = ["create", "delete", "update"];

    let { permissions } = watch();

    if (permissions.includes(id)) {
      permissions = without(permissions, id);
    } else {
      const pagePermissions = data.permissions;

      const viewPermission = find(pagePermissions, (permission: any) =>
        /view/i.test(permission.name),
      );

      // if view permission is there and current access is create delete or update permissions
      if (viewPermission && actionList.includes(currentAction)) {
        const { id } = viewPermission;

        if (!permissions.includes(id)) {
          permissions.push(id);
        }
      }

      permissions.push(id);
    }

    setValue("permissions", permissions);
  };

  if (isFetching)
    return (
      <div className="mt-80">
        <LoaderCircle />
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      autoComplete="off"
      className="w-full relative flex flex-col justify-between"
    >
      <div className="h-[calc(100vh_-_158px)] overflow-auto flex flex-col gap-y-4">
        <div className="rounded-2xl w-full flex flex-col gap-y-10 p-8">
          <div className="flex gap-x-4">
            <div className="flex-none w-2/12">
              <div className="flex flex-col">
                <div>
                  <span className="font-medium text-base">
                    {translate("admin.roles.form.name")}
                  </span>
                </div>
              </div>
            </div>
            <div className="grow gap-y-4 flex flex-col">
              <div>
                <Input
                  name="name"
                  placeholder={translate("admin.roles.form.namePlaceholder")}
                  className="w-full"
                  control={control}
                  errors={errors}
                />
              </div>
              <div>
                <Textarea
                  name="description"
                  control={control}
                  rows={4}
                  type="textarea"
                  placeholder={translate(
                    "admin.roles.form.descriptionPlaceholder",
                  )}
                  errors={errors}
                  maxChar={200}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-x-4">
            <div className="flex-none w-2/12">
              <div className="flex flex-col">
                <div>
                  <span className="font-medium text-base">
                    {translate("admin.roles.form.permissions")}
                  </span>
                </div>
              </div>
            </div>
            <div className="grow gap-y-4 flex flex-col">
              <div className="grid grid-cols-2 gap-6 w-full">
                {!isFetchingPermission &&
                  permissionsList.map(
                    (
                      data: { label: string; permissions: any[] },
                      index: number,
                    ) => (
                      <ul
                        className="flex gap-2 p-4 shadow-md rounded-lg"
                        key={index}
                      >
                        <li>
                          <div className="flex items-center gap-x-1">
                            <img src={allImgPaths.queues} />
                            <h4 className="font-bold capitalize">
                              {data.label}
                            </h4>
                          </div>
                          <ul className="flex gap-y-2 flex-col mt-4">
                            {data.permissions.map(
                              (
                                action: {
                                  label: string;
                                  name: string;
                                  id: string;
                                },
                                aIndex: number,
                              ) => (
                                <li
                                  className="flex items-center gap-x-1"
                                  key={aIndex}
                                >
                                  <Checkbox
                                    onChange={() =>
                                      onChangePermission(action, data)
                                    }
                                    checked={isChecked(action, data)}
                                    disabled={isDisabled(action, data)}
                                    name={action.id}
                                    id={action.id}
                                    label={action.label}
                                    className="text-base text-tertiary-700 gap-x-2"
                                  />
                                </li>
                              ),
                            )}
                          </ul>
                        </li>
                      </ul>
                    ),
                  )}
                {isFetchingPermission && "Fetching permission"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <DrawerFooter>
        <div className="w-full flex justify-end">
          <ButtonV2
            type="submit"
            // disabled={isSubmitting || !isValid}
            color="primary"
            loading={isUpdating || isCreating}
            rightIcon={allImgPaths.rightArrow}
          >
            {roleId
              ? isUpdating
                ? translate("common.updating")
                : translate("common.update")
              : isCreating
                ? translate("common.creating")
                : translate("common.create")}
          </ButtonV2>
        </div>
      </DrawerFooter>
    </form>
  );
};

export default Create;
