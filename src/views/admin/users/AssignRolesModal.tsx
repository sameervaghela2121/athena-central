import { debounce, get, replace, size, toUpper } from "lodash-es";
import queryString from "query-string";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import api from "@/apis/axiosInterceptor";
import allImgPaths from "@/assets";
import {
  ButtonV2,
  ClearIndicator,
  Modal,
  SelectComponent,
  UserListOption,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { HOST, MODULE_TYPE, ROLES } from "@/shared/constants";
import { renameRoleLabel } from "@/shared/functions";

const AssignRolesModal = ({
  user,
  onClose,
  show,
}: {
  onClose: () => void;
  user: {
    id: string;
    role: {
      id: string;
      name: string;
    };
    name: string;
    queues: any[];
  };
  show: boolean;
}) => {
  if (!show) return;

  const {
    id,
    role: { id: roleId, name },
    name: userName,
    queues = [],
  } = user;

  const { translate } = useTranslate();

  const { data, getRoles, isLoading } = useAppState(RootState.ROLES);
  const { updateUser, isUpdating } = useAppState(RootState.USERS);
  const { reAssignQueuesToOtherUser, isUpdating: isUpdatingQueues } =
    useAppState(RootState.QUEUES);

  const [selectedRoles, setSelectedRoles] = useState<any>({
    label: renameRoleLabel(name),
    value: roleId,
  });

  const [newQueueUser, setNewQueueUser] = useState<any>(null);

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isUserAssignedInAnyQueues, setIsUserAssignedInAnyQueues] =
    useState<boolean>(false);

  const fetchUsers = async (
    search: string = "",
    pagination?: { page_size: 100; page: 1 },
  ) => {
    try {
      setIsLoadingUsers(true);

      const stringified = queryString.stringify(
        { search, ...pagination, module_type: MODULE_TYPE.QUEUE },
        {
          skipEmptyString: true,
          skipNull: true,
        },
      );

      const { data } = await api.get(
        `${HOST.QUEUES}/queues/fetch-users-based-on-module?${stringified}`,
      );

      const result: any[] = [];

      get(data, "data.result", []).forEach((user: any) => {
        if (user.id !== id) {
          result.push({
            label: `${user.name} (${user.username})`,
            email: user.email,
            value: user.id,
            ...user,
          });
        }
      });

      setUsers(result);
      return result;
    } catch (error) {
      console.error("fetchUsers error =>", error);
      return [];
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    const stringified = queryString.stringify(
      {
        sort_field: "created_at",
        sort_order: "desc",
        is_filter_role_by_hierarchy: true,
      },
      {
        skipEmptyString: true,
        skipNull: true,
      },
    );

    getRoles(stringified);
    fetchUsers();
  }, [id]);

  useEffect(() => {
    const selectedNewRole = toUpper(
      replace(get(selectedRoles, "label"), " ", "_"),
    );

    if (name !== ROLES.CHATTER && selectedNewRole === ROLES.CHATTER) {
      setIsUserAssignedInAnyQueues(size(queues) > 0);
    } else {
      setIsUserAssignedInAnyQueues(false);
    }
  }, [selectedRoles, name, queues]);

  const assignRoles = async () => {
    const payload: any = {
      roles: [get(selectedRoles, "value")],
    };

    try {
      if (size(queues) > 0) {
        const newQueueAssignUsers = get(newQueueUser, "id", "");

        const newAssignmentQueuesPayload = {
          old_user: id,
          new_user: newQueueAssignUsers,
        };

        const result = await reAssignQueuesToOtherUser(
          newAssignmentQueuesPayload,
        );

        if (result.success) {
          toast.success(get(result, "message", "Queues assigned successfully"));
        }
      }

      await updateUser(id, payload);

      toast.success(`Roles assigned successfully`);
      onClose();
    } catch (error) {
      toast.error("Something went wrong, please try again later");
    }
  };

  const debouncedPromiseOptionsForAssignedUsers = debounce(
    (inputValue: string, callback: (options: any[]) => void) => {
      fetchUsers(inputValue, { page: 1, page_size: 100 }).then((users) => {
        callback(users); // Resolve with fetched users
      });
    },
    700,
  );

  const options: { value: string; label: string }[] = useMemo(
    () =>
      data.map((o) => {
        return {
          value: o.id,
          label: renameRoleLabel(o.name),
          name: o.name,
        };
      }),
    [data],
  );

  return (
    <div>
      <Modal size="xl" show={show} onClose={onClose} backdrop={false}>
        <div className="flex flex-col gap-y-10">
          <div className="flex flex-col gap-y-3">
            <div className="flex flex-col gap-y-3">
              <p className="text-lg font-medium capitalize">
                {translate("admin.user.assignRole.header")}
              </p>
              <div>
                <SelectComponent
                  menuPortalTarget={document.body}
                  isLoading={isLoading}
                  value={selectedRoles}
                  // isMulti
                  closeMenuOnSelect
                  name="roles"
                  placeholder={translate("admin.user.assignRole.placeholder")}
                  options={options}
                  defaultOptions
                  onChange={(data: any) => {
                    setSelectedRoles(data);
                  }}
                />
              </div>
            </div>
            {isUserAssignedInAnyQueues && (
              <>
                <div className="flex flex-col p-4 border rounded-lg border-tertiary-50 gap-y-4">
                  <div className="flex items-center gap-x-4">
                    <div className="w-10 h-10 p-2 rounded-full bg-status-error/10 shrink-0">
                      <img
                        src={allImgPaths.warningRedIcon}
                        alt="warningRedIcon"
                      />
                    </div>
                    <div>
                      <p className="text-base">
                        <span className="italic">
                          {userName ||
                            translate(
                              "admin.user.assignRole.assignQueue.thisUser",
                            )}
                        </span>{" "}
                        {translate(
                          "admin.user.assignRole.assignQueue.isAssignedTo",
                        )}{" "}
                        <span className="font-bold">
                          {`${size(queues)} ${translate("admin.user.assignRole.assignQueue.queues")}`}{" "}
                        </span>
                        <br />
                        <span className="text-status-error">
                          {translate(
                            "admin.user.assignRole.assignQueue.changingItsRoleWillLeaveTheQueuesWithoutSupport",
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-52">
                    {queues.map(({ id, name }, index) => (
                      <div
                        key={index}
                        className="flex items-center py-3 border-t gap-x-2 border-tertiary-50 last:pb-0"
                      >
                        <img
                          src={allImgPaths.lightBlueTickIcon}
                          alt="lightBlueTickIcon"
                          className="w-5 h-5 shrink-0"
                        />
                        <div>
                          <p>{name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-y-3">
                  <p className="text-base italic text-tertiary-900">
                    {translate(
                      "admin.user.assignRole.assignQueue.assignQueuesToUserBelow",
                    )}
                  </p>
                  <div>
                    <SelectComponent
                      isAsync
                      menuPortalTarget={document.body}
                      menuPlacement="top"
                      value={newQueueUser}
                      isLoading={isLoadingUsers}
                      name="assign_user"
                      placeholder={translate(
                        "queues.form.assignUsers.assignUsersPlaceholder",
                      )}
                      chipColor="#D9F0F9"
                      closeMenuOnSelect
                      defaultOptions
                      cacheOptions={users}
                      loadOptions={debouncedPromiseOptionsForAssignedUsers}
                      components={{
                        DropdownIndicator: () => null,
                        IndicatorSeparator: () => null,
                        ClearIndicator: ClearIndicator,
                        Option: UserListOption,
                      }}
                      onChange={(data: any) => {
                        setNewQueueUser(data);
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-center gap-x-5">
            <div>
              <ButtonV2 onClick={onClose} variant="tertiaryDark">
                {translate("common.cancel")}
              </ButtonV2>
            </div>
            <div>
              <ButtonV2
                disabled={size(selectedRoles) <= 0}
                loading={isUpdating}
                onClick={assignRoles}
                variant="primary"
                rightIcon={allImgPaths.rightArrow}
              >
                {translate("common.submit")}
              </ButtonV2>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignRolesModal;
