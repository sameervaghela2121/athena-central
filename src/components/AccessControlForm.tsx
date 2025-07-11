import {
  cloneDeep,
  differenceBy,
  find,
  get,
  includes,
  omit,
  size,
  toLower,
  values,
} from "lodash-es";
import queryString from "query-string";
import { useState } from "react";

import request from "@/apis/KE";
import api from "@/apis/axiosInterceptor";
import allImgPaths from "@/assets";
import { useTranslate } from "@/hooks";
import { ACCESS_ROLE, HOST } from "@/shared/constants";
import { filterPermissions } from "@/shared/functions";

import { ButtonV2, ClearIndicator, UserListOption } from ".";
import Dropdown from "./Dropdown";
import Label from "./Label";
import SelectComponent from "./Select";

const PERMISSIONS_OPTIONS = [
  {
    id: ACCESS_ROLE.OWNER,
    name: (
      <div className="flex items-center gap-x-2">
        <img src={allImgPaths.userSecondary} />
        <span className="font-medium text-tertiary-700">
          {ACCESS_ROLE.OWNER}
        </span>
      </div>
    ),
  },
  {
    id: ACCESS_ROLE.EDITOR,
    name: (
      <div className="flex items-center gap-x-2">
        <img src={allImgPaths.editIcon} />
        <span className="font-medium text-tertiary-700">
          {ACCESS_ROLE.EDITOR}
        </span>
      </div>
    ),
  },
  {
    id: ACCESS_ROLE.VIEWER,
    name: (
      <div className="flex items-center gap-x-2">
        <img src={allImgPaths.viewEye} />
        <span className="font-medium text-tertiary-700">
          {ACCESS_ROLE.VIEWER}
        </span>
      </div>
    ),
  },
];

const AccessControlForm = (props: any) => {
  const {
    users = [],
    disabled = false,
    setUsers,
    errors,
    selectedUsersPermission,
    accessOptions,
    setSelectedUsersPermission,
    addUsers,
    attributes_access,
    groupAttribute,
    getValues,
    setValue,
    attributes,
    users_access,
    watch,
    currentUserAccess,
    userId,
  } = props;

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);

  const { translate } = useTranslate();

  const customFilterOption = (
    option: { label: string; value: string; data: any },
    inputValue: string,
  ) => {
    const { label, data } = option;
    const email = data.email || "";
    const searchTarget = `${label} ${email}`;

    return includes(toLower(searchTarget), toLower(inputValue));
  };

  const searchedAttributesValues = () => {
    const { attributes } = getValues();
    const _attributes = omit(attributes, "permissions", "count");
    const users = get(attributes, "count", 0);
    const allValues = values(_attributes);

    if (users <= 0) return;
    const msg = `${users} Users (${allValues.join(" / ")})`;

    return (
      <div className="flex flex-col gap-y-1">
        <span>{msg}</span>
        <span className="font-medium text-tertiary-400"></span>
      </div>
    );
  };

  const addAttribute = () => {
    const { attributes, attributes_access = [] } = getValues();

    attributes_access.push(attributes);
    setValue("attributes_access", attributes_access);
    setValue("attributes", {});

    groupAttribute.map((attribute: any) => {
      setValue(attribute.name, "");
    });
  };

  const fetchUsers = async (name?: string) => {
    try {
      setIsLoadingUsers(true);

      const { users_access = [] } = watch();

      const stringified = queryString.stringify(
        { username: name, page_size: 100, page: 1 },
        {
          skipEmptyString: true,
          skipNull: true,
        },
      );

      const { data } = await api.get(`${HOST.USERS}/users?${stringified}`);

      const result = get(data, "data.result", []).map((user: any) => ({
        label: `${user.name} (${user.username})`,
        email: user.email,
        name: user.name,
        username: user.username,
        value: user._id ?? user.id,
      }));

      const updatedUserList: any[] = differenceBy(
        result,
        users_access,
        "value",
      );

      setUsersList(updatedUserList);

      return result;
    } catch (error) {
      console.error("error =>", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const removeUser = (index: number) => {
    const { users_access = [] } = getValues();

    users_access.splice(index, 1);
    setValue("users_access", users_access);

    fetchUsers();
  };

  const removeAttribute = (index: number) => {
    const { attributes_access = [] } = getValues();

    attributes_access.splice(index, 1);
    setValue("attributes_access", attributes_access);
  };

  const AccessControlDropdown = ({
    userAccess,
    index,
  }: {
    userAccess: any;
    index: number;
  }) => {
    if (
      currentUserAccess === ACCESS_ROLE.VIEWER ||
      userId === userAccess.value
    ) {
      return (
        <>
          <Dropdown
            disabled={true}
            className="min-w-44"
            label={userAccess.permissions?.name ?? ACCESS_ROLE.VIEWER}
            items={[]}
            selectedItem={userAccess.permissions}
            onSelect={() => {}}
          />
        </>
      );
    } else {
      const allowedAccessDropdown = filterPermissions(
        currentUserAccess,
        accessOptions,
      );

      const isEditable = canEditAccess(
        currentUserAccess,
        userAccess.permissions?.id,
      );

      if (isEditable) {
        return (
          <Dropdown
            disabled={disabled}
            className="min-w-44"
            label={userAccess.permissions?.name ?? ACCESS_ROLE.VIEWER}
            items={[
              ...allowedAccessDropdown,
              {
                id: "Remove",
                name: (
                  <div className="flex items-center gap-x-2">
                    <img src={allImgPaths.trash} />
                    <span className="font-medium text-tertiary-700">
                      Remove access
                    </span>
                  </div>
                ),
              },
            ]}
            onSelect={(item: any) => {
              if (item.id === "Remove") {
                removeUser(index);
              } else {
                const _userAccess = cloneDeep(users_access);
                _userAccess[index].permissions = item;

                setValue("users_access", _userAccess);
              }
            }}
            selectedItem={userAccess.permissions}
          />
        );
      } else {
        return (
          <>
            <Dropdown
              disabled={true}
              className="min-w-44"
              label={userAccess.permissions?.name ?? ACCESS_ROLE.VIEWER}
              items={[]}
              selectedItem={userAccess.permissions}
              onSelect={() => {}}
            />
          </>
        );
      }
    }
  };

  // Function to check if the user can edit the target user's access
  const canEditAccess = (currentUserRole: string, targetUserRole: string) => {
    // Only allow editing if the current user's role is greater than or equal to the target user's role
    const roleHierarchy = [
      ACCESS_ROLE.VIEWER,
      ACCESS_ROLE.EDITOR,
      ACCESS_ROLE.OWNER,
    ];
    const currentUserRank = roleHierarchy.indexOf(currentUserRole);
    const targetUserRank = roleHierarchy.indexOf(targetUserRole);
    return currentUserRank >= targetUserRank;
  };

  return (
    <>
      <div className="flex flex-col grow gap-y-4">
        <div className="flex flex-col">
          <Label>Add Members to KE</Label>
          <span className="text-sm italic text-tertiary-400">
            Select users manually or filter by attributes to add to this KE,
            ensuring accurate member assignment.
          </span>
        </div>

        <div className="p-4 rounded-lg shadow-md">
          {/* Add Specific People to this Group */}
          <div className="flex flex-col gap-y-4">
            <div className="flex items-baseline gap-x-2">
              <div className="flex flex-col">
                <label className="cursor-pointer select-none">
                  Add Specific People to this KE
                </label>
                <span className="text-sm italic text-tertiary-400">
                  All employees from the selected region, location, or hotel
                  will be assigned the same chosen role. You can manage this
                  role for all at once.
                </span>
              </div>
            </div>

            <div className={"mb-4"}>
              <div className="flex items-start justify-center gap-x-1">
                <div className="w-full">
                  <SelectComponent
                    value={users}
                    isLoading={isLoadingUsers}
                    isMulti
                    filterOption={customFilterOption}
                    isDisabled={disabled}
                    name="users"
                    placeholder={translate(
                      "admin.groups.form.addMembersToGroup.addSpecificPeopleToThisGroupPlaceholder",
                    )}
                    className="w-full"
                    options={usersList}
                    // loadOptions={debouncedPromiseOptions}
                    chipColor="#D9F0F9"
                    components={{
                      Option: UserListOption,
                      ClearIndicator: ClearIndicator,
                      DropdownIndicator: () => null,
                      IndicatorSeparator: () => null,
                    }}
                    onChange={(data: any) => {
                      setUsers(data);
                    }}
                    errors={errors}
                  />
                </div>

                <div className="flex w-36">
                  <div className="flex items-center gap-x-2">
                    <Dropdown
                      disabled={disabled}
                      className="min-w-[140px] !h-[50px]"
                      label={
                        selectedUsersPermission?.name ??
                        get(accessOptions, "[0].name", ACCESS_ROLE.VIEWER)
                      }
                      items={accessOptions}
                      onSelect={(item: any) => setSelectedUsersPermission(item)}
                      selectedItem={selectedUsersPermission}
                    />
                  </div>
                </div>
              </div>
              {/* add user button */}
              <div className="flex justify-end w-full">
                {!disabled && (
                  <ButtonV2
                    disabled={disabled}
                    variant="text"
                    onClick={() => addUsers()}
                    leftIcon={allImgPaths.addRounded}
                    className="!h-[42px] w-[140px] !text-primary-900 !no-underline !justify-end"
                  >
                    {size(attributes_access) > 0 ? "Add more" : "Add"}
                  </ButtonV2>
                )}
              </div>
            </div>
          </div>
          {/* Add by Attributes */}

          {size(groupAttribute) > 0 && (
            <div className="flex flex-col gap-y-4">
              <div className="flex items-baseline gap-x-2">
                <label
                  className="cursor-pointer select-none"
                  htmlFor="BY_ATTRIBUTE"
                >
                  Define by Attributes
                </label>
              </div>

              <div className="">
                <div className="grid grid-cols-2 gap-4">
                  {groupAttribute.map((attribute: any, index: number) => (
                    <div key={index}>
                      <SelectComponent
                        isDisabled={disabled}
                        value={getValues(attribute.name)}
                        isLoading={isLoadingUsers}
                        // isMulti
                        closeMenuOnSelect
                        name={attribute.name}
                        placeholder={attribute.placeholder}
                        options={attribute.options}
                        chipColor="#EBEBEB"
                        // isOptionDisabled={() =>
                        //   size(getValues(attribute.name)) >= 1
                        // }
                        components={{
                          Option: ({ children, ...props }) => {
                            const data: any = props.data;

                            return (
                              <div
                                {...props.innerProps}
                                className={`hover:border-l-primary-900 border-l-2 border-l-transparent flex flex-col custom-option gap-x-1 cursor-pointer hover:bg-tertiary-50 duration-300 p-2 ${props.isSelected ? "bg-secondary-200" : "bg-transparent"}`}
                              >
                                <div className="flex gap-x-2">
                                  <div>
                                    <div className="flex items-center">
                                      <span className="text-gray-900">
                                        {data.label}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-sm italic text-gray-500">
                                        {data.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          },
                          DropdownIndicator: () => null,
                          IndicatorSeparator: () => null,
                        }}
                        onChange={(data: any) => {
                          setValue(attribute.name, data, {
                            shouldValidate: true,
                          });

                          let _attributes: any = cloneDeep(attributes);

                          if (get(data, "value")) {
                            _attributes = {
                              ..._attributes,
                              [attribute.name]: get(data, "value"),
                              permissions: selectedUsersPermission?.id,
                            };
                          } else {
                            _attributes = omit(_attributes, attribute.name);
                          }

                          const payload = omit(_attributes, [
                            "permissions",
                            "count",
                          ]);

                          request
                            .fetchUsersCountByAttribute({
                              attributes: [payload],
                            })
                            .then(({ result }) => {
                              setValue("attributes", {
                                ..._attributes,
                                count: result.length,
                                permissions: find(PERMISSIONS_OPTIONS, {
                                  id: ACCESS_ROLE.VIEWER,
                                }),
                              });
                            })
                            .catch((err) => {
                              setValue(
                                "attributes",
                                {
                                  ..._attributes,
                                  count: 0,
                                  permissions: find(PERMISSIONS_OPTIONS, {
                                    id: ACCESS_ROLE.VIEWER,
                                  }),
                                },
                                {
                                  shouldValidate: true,
                                },
                              );
                            });

                          setValue(attribute.name, data, {
                            shouldValidate: true,
                          });
                        }}
                        errors={errors}
                      />
                    </div>
                  ))}
                </div>

                {/* add new member by attribute */}
                {size(searchedAttributesValues()) > 0 && (
                  <div className="flex flex-col p-3 mt-8 shadow-md gap-y-2">
                    <div className="flex justify-between w-full">
                      <div>{searchedAttributesValues()}</div>
                      <div className="max-w-36">
                        <div className="flex items-center gap-x-1">
                          <Dropdown
                            disabled={disabled}
                            className="min-w-36"
                            items={accessOptions}
                            label={
                              attributes.permissions.name ??
                              get(accessOptions, "[0].name", ACCESS_ROLE.VIEWER)
                            }
                            onSelect={(item: any) => {
                              setValue("attributes", {
                                ...attributes,
                                permissions: item,
                              });
                            }}
                            selectedItem={attributes.permissions}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end w-full">
                      <ButtonV2
                        variant="text"
                        onClick={() => addAttribute()}
                        leftIcon={allImgPaths.addRounded}
                        className="!h-[42px] !text-primary-900 !no-underline"
                      >
                        {size(attributes_access) > 0 ? "Add more" : "Add"}
                      </ButtonV2>
                    </div>
                  </div>
                )}

                {/* selected attributes */}
                <div className="flex flex-col mt-8 gap-y-2">
                  {users_access?.map((userAccess: any, index: number) => (
                    <div className="flex justify-between" key={index}>
                      <div>
                        <span className="font-medium">
                          {`${userAccess.name} (${userAccess.username})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-x-1">
                        <div>
                          <AccessControlDropdown
                            userAccess={userAccess}
                            index={index}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {attributes_access?.map((attributes: any, index: number) => (
                    <div className="flex justify-between" key={index}>
                      <div>
                        <span className="">{attributes.count} Users</span>{" "}
                        <span className="font-medium text-tertiary-400">
                          {values(
                            omit(attributes, "permissions", "count"),
                          ).join(" / ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-x-1">
                        <div>
                          <Dropdown
                            disabled={disabled}
                            className="min-w-44"
                            label={
                              attributes.permissions?.name ??
                              get(accessOptions, "[0].name", ACCESS_ROLE.VIEWER)
                            }
                            items={[
                              ...accessOptions,
                              {
                                id: "Remove",
                                name: (
                                  <div className="flex items-center gap-x-2">
                                    <img src={allImgPaths.trash} />
                                    <span className="font-medium text-tertiary-700">
                                      Remove access
                                    </span>
                                  </div>
                                ),
                              },
                            ]}
                            onSelect={(item: any) => {
                              if (item.id === "Remove") {
                                removeAttribute(index);
                              } else {
                                const _attributes_access =
                                  cloneDeep(attributes_access);
                                _attributes_access[index].permissions = item;
                                setValue(
                                  "attributes_access",
                                  _attributes_access,
                                );
                              }
                            }}
                            selectedItem={attributes.permissions}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AccessControlForm;
