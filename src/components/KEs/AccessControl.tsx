import {
  cloneDeep,
  debounce,
  get,
  isBoolean,
  isEqual,
  map,
  omit,
  reject,
  size,
  some,
  toLower,
  values,
} from "lodash-es";
import queryString from "query-string";
import React, { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";

import request from "@/apis/KE";
import api from "@/apis/axiosInterceptor";
import userRequest from "@/apis/users";
import allImgPaths from "@/assets";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { ACCESS_ROLE, FORM_LINK, HOST, MODULE_TYPE } from "@/shared/constants";
import { download } from "@/shared/functions";

import ButtonV2 from "../ButtonV2";
import Checkbox from "../Checkbox";
import ClearIndicator from "../ClearIndicator";
import Divider from "../Divider";
import Label from "../Label";
import LabelInfo from "../LabelInfo";
import Loader from "../Loader";
import Modal from "../Modal";
import Popover from "../Popover";
import SelectComponent from "../Select";
import Tabs from "../Tabs";
import Tooltip from "../Tooltip";
import UserListOption from "../UserListOption";

const ViewPermission = React.memo(
  ({
    setValue,
    getValues,
    formValues,
  }: {
    setValue: any;
    getValues: any;
    formValues: any;
  }) => {
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [users, setUsers] = useState([]);
    const [groupAttribute, setGroupAttribute] = useState<any[]>([]);
    const [defaultAttributeOptions, setDefaultAttributeOptions] = useState<any>(
      {},
    );
    const [isLoadingAttributesCount, setIsLoadingAttributesCount] =
      useState(false);

    const {
      attributes = {},
      usersViewAccess = [],
      attributes_access = [],
      view,
    }: any = formValues;

    const { translate } = useTranslate();
    const { fetchGroupAttribute } = useAppState(RootState.GROUPS);
    const {
      user: { id, is_entity_enabled = false, is_corporate_entity = false },
    } = useAppState(RootState.AUTH);

    useEffect(() => {
      fetchAttribute();
      fetchUsers();
      fetchAttributesList({ key: "", value: "" });
    }, []);

    const fetchAttribute = async () => {
      try {
        const { CUSTOM_ATTRIBUTES = [], SYSTEM_ATTRIBUTES = [] } =
          await fetchGroupAttribute();

        let attributeList = [...SYSTEM_ATTRIBUTES, ...CUSTOM_ATTRIBUTES];

        // remove entity attribute if entity disabled
        if (!is_entity_enabled) {
          attributeList = reject(attributeList, { name: "entity" });
        }

        if (size(attributeList)) {
          setGroupAttribute(attributeList);
        }
      } catch (error) {
        console.error("error =>", error);
      }
    };

    const fetchUsers = async (
      search: string = "",
      pagination?: { page_size: 100; page: 1 },
    ) => {
      try {
        setIsLoadingUsers(true);

        const stringified = queryString.stringify(
          { search, ...pagination, module_type: MODULE_TYPE.KE_VIEWER },
          {
            skipEmptyString: true,
            skipNull: true,
          },
        );

        const { data } = await api.get(
          `${HOST.QUEUES}/queues/fetch-users-based-on-module?${stringified}`,
        );

        const result = get(data, "data.result", [])
          .filter((user: any) => (user._id ?? user.id) !== id)
          .map((user: any) => {
            return {
              label: `${user.name} (${user.username})`,
              email: user.email,
              name: user.name,
              username: user.username,
              value: user._id ?? user.id,
              user: user._id ?? user.id,
              permissions: ACCESS_ROLE.VIEWER,
            };
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

    const fetchAttributesList = async ({
      key = "",
      value = "",
    }: {
      key: string;
      value: string;
    }) => {
      try {
        const stringified = queryString.stringify(
          { [key]: value },
          {
            skipEmptyString: true,
            skipNull: true,
          },
        );

        const { data } = await api.get(
          `${HOST.USERS}/users/distinct-attribute-values?${stringified}`,
        );

        const defaultOptionRawData = get(data, `data.result`, {});

        if (size(defaultOptionRawData) > 0) {
          let defaultOptions = defaultOptionRawData;
          let options: any = { ...defaultAttributeOptions };

          defaultOptions = Object.entries(defaultOptions).map(
            ([key, value]: any) => {
              options[key] = value.map((val: any) => {
                const opt = isBoolean(val) ? (val ? "true" : "false") : val;

                return {
                  value: opt,
                  label: opt,
                };
              });
            },
          );

          setDefaultAttributeOptions(options);
        }

        const result = get(data, `data.result[${key}]`, []).map((o: any) => ({
          label: o,
          value: o,
        }));

        return result;
      } catch (error) {
        console.error("fetchAttributesList error =>", error);
        return [];
      }
    };

    const searchedAttributesValues = () => {
      const { attributes } = getValues();
      const _attributes = omit(attributes, "permissions", "users", "count");
      const users = get(attributes, "count", 0);

      if (size(_attributes) <= 0) return;

      const allValues = values(_attributes);

      let msg = `${users} Users (${allValues.join(" / ")})`;
      if (users <= 0) {
        msg = `${allValues.join(" / ")}`;
      }

      return (
        <div className="flex justify-between items-center w-full">
          <div>
            <Tooltip content={<div className="break-words">{msg}</div>}>
              {msg}
            </Tooltip>
          </div>
          <div className="min-w-20">
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
        </div>
      );
    };

    const addAttribute = () => {
      const { attributes, attributes_access = [] } = getValues();
      const exists = some(attributes_access, (obj) => isEqual(obj, attributes));

      if (!exists) {
        attributes_access.push(attributes);

        setValue("attributes_access", attributes_access);
        setValue("attributes", {});

        groupAttribute.map((attribute: any) => {
          setValue(attribute.name, "");
        });
      } else {
        setValue("attributes", {});
      }
    };

    const removeAttribute = (index: number) => {
      const { attributes_access = [] } = getValues();

      attributes_access.splice(index, 1);
      setValue("attributes_access", attributes_access);
    };

    const exportList = async (index: number) => {
      const { attributes_access = [] } = getValues();

      const { users: user_ids = [] } = attributes_access[index];

      const _attributes = omit(
        attributes_access[index],
        "permissions",
        "users",
        "count",
      );

      const allValues = toLower(values(_attributes).join("_"));

      try {
        const data = await userRequest.exportUserList({
          response_type: "csv",
          user_ids,
        });

        download(data, `${allValues}.csv`);
      } catch (error) {
        console.error("exportList error =>", error);
      }
    };

    const changeOption = (
      key:
        | "giveAllViewAccess"
        | "giveCustomViewAccess"
        | "byAttribute"
        | "byName"
        | "include_all_franchises",
      value: boolean,
    ) => {
      let _view = { ...view, [key]: value };
      switch (key) {
        case "giveAllViewAccess":
          _view = {
            ...view,
            [key]: value,
            giveCustomViewAccess: !value,
            byAttribute: false,
            byName: false,
            include_all_franchises: true,
          };
          break;
        case "giveCustomViewAccess":
          _view = {
            ...view,
            [key]: value,
            giveAllViewAccess: !value,
            include_all_franchises: false,
          };
          break;

        default:
          break;
      }

      setValue("view", _view);
    };

    const createDebouncedPromiseOptionsForAttributes = (key: string) => {
      return debounce(
        (inputValue: string, callback: (options: any[]) => void) => {
          fetchAttributesList({ key, value: inputValue }).then((values) => {
            callback(values); // Resolve with fetched values
          });
        },
        700,
      );
    };

    const debouncedPromiseOptions = debounce(
      (inputValue: string, callback: (options: any[]) => void) => {
        fetchUsers(inputValue, { page: 1, page_size: 100 }).then((users) => {
          callback(users); // Resolve with fetched users
        });
      },
      700,
    ); // 700ms debounce delay

    return (
      <div className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between">
            <div className="flex gap-x-2">
              <div>
                <input
                  type="radio"
                  id="step1"
                  checked={view.giveAllViewAccess}
                  onChange={() => {
                    changeOption("giveAllViewAccess", !view.giveAllViewAccess);
                  }}
                />
              </div>
              <div>
                <Label className="cursor-pointer" htmlFor="step1">
                  {translate(
                    "KEs.form.assignAccess.giveViewingPermission.giveAccessToAllUsers.label",
                  )}
                </Label>
              </div>
            </div>
            <div className="cursor-pointer">
              <Popover
                position="bottom"
                content={
                  <div className="w-96">
                    {translate(
                      "KEs.form.assignAccess.giveViewingPermission.giveAccessToAllUsers.helpInfo",
                    )}
                  </div>
                }
                trigger={<img src={allImgPaths.infoHint} alt="" />}
              ></Popover>
            </div>
          </div>
          <div>
            <span className="ml-5 text-sm italic text-tertiary-400">
              {translate(
                "KEs.form.assignAccess.giveViewingPermission.giveAccessToAllUsers.caption",
              )}
            </span>
          </div>
          {is_entity_enabled && is_corporate_entity && (
            <div className="flex gap-x-4 ml-7">
              <div className="flex gap-x-2">
                <div>
                  <input
                    type="radio"
                    id="includeAllFranchises"
                    disabled={!view.giveAllViewAccess}
                    checked={
                      view.giveAllViewAccess && view.include_all_franchises
                    }
                    onChange={() => {
                      changeOption(
                        "include_all_franchises",
                        !view.include_all_franchises,
                      );
                    }}
                  />
                </div>
                <div>
                  <Label
                    className="cursor-pointer"
                    htmlFor="includeAllFranchises"
                  >
                    {translate(
                      "KEs.form.assignAccess.giveViewingPermission.giveAccessToAllUsers.includeAllFranchises",
                    )}
                  </Label>
                </div>
              </div>
              <div className="flex gap-x-2">
                <div>
                  <input
                    type="radio"
                    id="excludeAllFranchises"
                    disabled={!view.giveAllViewAccess}
                    checked={
                      view.giveAllViewAccess && !view.include_all_franchises
                    }
                    onChange={() => {
                      changeOption(
                        "include_all_franchises",
                        !view.include_all_franchises,
                      );
                    }}
                  />
                </div>
                <div>
                  <Label
                    className="cursor-pointer"
                    htmlFor="excludeAllFranchises"
                  >
                    {translate(
                      "KEs.form.assignAccess.giveViewingPermission.giveAccessToAllUsers.excludeAllFranchises",
                    )}
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          <Divider label="OR" />
        </div>
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between">
            <div className="flex gap-x-2">
              <div>
                <input
                  type="radio"
                  id="step2"
                  checked={view.giveCustomViewAccess}
                  onChange={() => {
                    changeOption(
                      "giveCustomViewAccess",
                      !view.giveCustomViewAccess,
                    );
                  }}
                />
              </div>
              <div>
                <Label className="cursor-pointer" htmlFor="step2">
                  {translate(
                    "KEs.form.assignAccess.giveViewingPermission.giveAccessByAttributeOrName.label",
                  )}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-y-4 ml-6">
            <div className="flex justify-between mt-4">
              <div>
                <div className="flex gap-x-2">
                  <Checkbox
                    disabled={
                      !view.giveCustomViewAccess && !view.giveCustomViewAccess
                    }
                    id="attribute"
                    checked={view.byAttribute}
                    onChange={() => {
                      changeOption("byAttribute", !view.byAttribute);
                    }}
                  />
                  <Label className="cursor-pointer" htmlFor="attribute">
                    {translate(
                      "KEs.form.assignAccess.giveViewingPermission.giveAccessByAttributeOrName.byAttribute",
                    )}
                  </Label>
                </div>
                <div>
                  <span className="ml-8 text-sm italic text-tertiary-400">
                    {translate(
                      "KEs.form.assignAccess.giveViewingPermission.giveAccessByAttributeOrName.byAttributeCaption",
                    )}
                  </span>
                </div>
              </div>

              <div>
                <div className="cursor-pointer">
                  <Popover
                    position="bottom"
                    content={
                      <div className="w-96">
                        {translate(
                          "KEs.form.assignAccess.giveViewingPermission.giveAccessByAttributeOrName.byAttributeHelpInfo",
                        )}
                      </div>
                    }
                    trigger={<img src={allImgPaths.infoHint} alt="" />}
                  ></Popover>
                </div>
              </div>
            </div>

            <div>
              {size(groupAttribute) > 0 && (
                <div className="flex flex-col gap-y-4">
                  <div className="">
                    <div className="grid grid-cols-2 gap-4">
                      {groupAttribute.map((attribute: any, index: number) => {
                        return (
                          <div key={index}>
                            <SelectComponent
                              isAsync
                              key={attribute.name}
                              value={getValues(attribute.name)}
                              isLoading={isLoadingUsers}
                              isMulti
                              isClearable
                              isDisabled={
                                !view.byAttribute || !view.giveCustomViewAccess
                              }
                              // closeMenuOnSelect
                              name={attribute.name}
                              placeholder={attribute.placeholder}
                              options={attribute.options}
                              chipColor="#EBEBEB"
                              defaultOptions={
                                defaultAttributeOptions[attribute.name]
                              }
                              cacheOptions={
                                defaultAttributeOptions[attribute.name]
                              }
                              loadOptions={createDebouncedPromiseOptionsForAttributes(
                                attribute.name,
                              )}
                              onInputChange={(
                                inputValue: any,
                                { action }: any,
                              ) => {
                                if (
                                  action === "input-change" &&
                                  inputValue === ""
                                ) {
                                  // Re-fetch default options or load fresh options for empty input
                                  createDebouncedPromiseOptionsForAttributes(
                                    attribute.name,
                                  )("", (options) => {
                                    const _defaultAttributeOptions = cloneDeep(
                                      defaultAttributeOptions,
                                    );
                                    _defaultAttributeOptions[attribute.name] =
                                      options;
                                    setDefaultAttributeOptions(
                                      _defaultAttributeOptions,
                                    );
                                  });
                                }
                              }}
                              onChange={(data: any) => {
                                let _attributes: any = cloneDeep(attributes);

                                if (size(map(data, "value")) > 0) {
                                  _attributes = {
                                    ..._attributes,
                                    [attribute.name]: map(data, "value"),
                                    permissions: ACCESS_ROLE.VIEWER,
                                  };
                                } else {
                                  _attributes = omit(
                                    _attributes,
                                    attribute.name,
                                  );
                                }

                                const payload = omit(_attributes, [
                                  "permissions",
                                  "users",
                                  "count",
                                ]);

                                setIsLoadingAttributesCount(true);

                                request
                                  .fetchUsersCountByAttribute({
                                    attributes: [payload],
                                  })
                                  .then(({ result }) => {
                                    setValue("attributes", {
                                      ..._attributes,
                                      count: result.length,
                                      users: result,
                                      permissions: ACCESS_ROLE.VIEWER,
                                    });
                                  })
                                  .catch((err) => {
                                    createDebouncedPromiseOptionsForAttributes(
                                      attribute.name,
                                    )("", (options) => {
                                      const _defaultAttributeOptions =
                                        cloneDeep(defaultAttributeOptions);

                                      _defaultAttributeOptions[attribute.name] =
                                        options;
                                      setDefaultAttributeOptions(
                                        _defaultAttributeOptions,
                                      );
                                    });

                                    setValue(
                                      "attributes",
                                      {
                                        ..._attributes,
                                        count: 0,
                                        permissions: ACCESS_ROLE.VIEWER,
                                      },
                                      {
                                        shouldValidate: true,
                                      },
                                    );
                                  })
                                  .finally(() => {
                                    setIsLoadingAttributesCount(false);
                                  });

                                setValue(attribute.name, data, {
                                  shouldValidate: true,
                                });
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {/* add new member by attribute */}
                    {isLoadingAttributesCount ? (
                      <div className="flex flex-col gap-y-2 p-3 mt-8 shadow-md">
                        <Loader count={1} height={32} />
                      </div>
                    ) : (
                      size(searchedAttributesValues()) > 0 &&
                      size(attributes) > 0 && (
                        <div className="flex flex-col gap-y-2 px-3 mt-8 rounded-lg shadow-md bg-secondary-50">
                          <div className="flex justify-between items-center w-full truncate line-clamp-1">
                            {searchedAttributesValues()}
                          </div>
                        </div>
                      )
                    )}
                    {/* selected attributes */}
                    {size(attributes_access) > 0 && (
                      <div className="flex flex-col gap-y-2 px-3 py-1 mt-8 rounded-lg bg-secondary-100">
                        {attributes_access?.map(
                          (attributes: any, index: number) => (
                            <div
                              className="flex justify-between items-center"
                              key={index}
                            >
                              <div>
                                {attributes.count > 0 && (
                                  <span className="">
                                    {attributes.count} Users
                                  </span>
                                )}{" "}
                                <span className="font-medium text-tertiary-400">
                                  {values(
                                    omit(
                                      attributes,
                                      "permissions",
                                      "count",
                                      "users",
                                    ),
                                  ).join(" / ")}
                                </span>
                              </div>

                              <div className="flex gap-x-1 justify-center items-center shrink-0">
                                {attributes.count > 0 && (
                                  <div
                                    className="p-2 rounded-full duration-500 cursor-pointer hover:bg-secondary-900/20"
                                    onClick={() => exportList(index)}
                                  >
                                    <img
                                      src={allImgPaths.exportIcon}
                                      alt=""
                                      className="w-6 h-6"
                                    />
                                  </div>
                                )}
                                <div
                                  className="p-2 rounded-full duration-500 cursor-pointer hover:bg-status-error/20"
                                  onClick={() => removeAttribute(index)}
                                >
                                  <img
                                    src={allImgPaths.trash}
                                    alt=""
                                    className="w-6 h-6"
                                  />
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3">
              <Divider className="bg-[#EBEBEB]" />
            </div>
            <div className="mt-3">
              <div className="flex justify-between">
                <div>
                  <div className="flex gap-x-2">
                    <Checkbox
                      disabled={!view.giveCustomViewAccess && !view.byName}
                      id="name"
                      checked={view.byName}
                      onChange={() => {
                        changeOption("byName", !view.byName);
                      }}
                    />
                    <Label className="cursor-pointer" htmlFor="name">
                      {translate(
                        "KEs.form.assignAccess.giveViewingPermission.giveAccessByAttributeOrName.byName",
                      )}
                    </Label>
                  </div>
                  <div>
                    <span className="ml-8 text-sm italic text-tertiary-400">
                      {translate(
                        "KEs.form.assignAccess.giveViewingPermission.giveAccessByAttributeOrName.byNameCaption",
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="cursor-pointer">
                    <Popover
                      position="bottom"
                      content={
                        <div className="w-96">
                          {translate(
                            "KEs.form.assignAccess.giveViewingPermission.giveAccessByAttributeOrName.byNameHelpInfo",
                          )}
                        </div>
                      }
                      trigger={<img src={allImgPaths.infoHint} alt="" />}
                    ></Popover>
                  </div>
                </div>
              </div>
              <div>
                <SelectComponent
                  isAsync
                  menuPortalTarget={document.body}
                  value={usersViewAccess}
                  isLoading={isLoadingUsers}
                  isMulti
                  menuPlacement="top"
                  name="users"
                  isDisabled={!view.byName}
                  placeholder={translate(
                    "KEs.form.assignAccess.giveViewingPermission.giveAccessByAttributeOrName.byNamePlaceholder",
                  )}
                  defaultOptions
                  cacheOptions={users}
                  loadOptions={debouncedPromiseOptions}
                  chipColor="#D9F0F9"
                  components={{
                    Option: UserListOption,
                    ClearIndicator: ClearIndicator,
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                  }}
                  onChange={(data: any) => {
                    setValue("usersViewAccess", data);
                  }}
                  // errors={errors}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

const EditPermission = React.memo(
  ({
    setValue,
    formValues,
  }: {
    setValue: any;
    getValues: any;
    formValues: any;
  }) => {
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    const { translate } = useTranslate();

    const { usersEditAccess = [], edit }: any = formValues;

    const fetchUsers = async (
      search: string = "",
      pagination?: { page_size: 100; page: 1 },
    ) => {
      try {
        setIsLoadingUsers(true);

        const stringified = queryString.stringify(
          { search, ...pagination, module_type: MODULE_TYPE.KE_EDITOR },
          {
            skipEmptyString: true,
            skipNull: true,
          },
        );

        const { data } = await api.get(
          `${HOST.QUEUES}/queues/fetch-users-based-on-module?${stringified}`,
        );

        const result = get(data, "data.result", []).map((user: any) => ({
          label: `${user.name} (${user.username})`,
          email: user.email,
          name: user.name,
          username: user.username,
          value: user._id ?? user.id,
          user: user._id ?? user.id,
          permissions: ACCESS_ROLE.EDITOR,
        }));
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
      fetchUsers();
    }, []);

    const changeOption = (
      key:
        | "giveAllEditAccess"
        | "giveCustomEditAccess"
        | "editAccessToAllAdmins",
      value: boolean,
    ) => {
      let _edit = { ...edit, [key]: value };
      switch (key) {
        case "editAccessToAllAdmins":
          _edit = {
            ...edit,
            [key]: value,
            giveAllEditAccess: !value,
            giveCustomEditAccess: !value,
          };
          break;
        case "giveAllEditAccess":
          _edit = {
            ...edit,
            [key]: value,
            giveCustomEditAccess: !value,
            editAccessToAllAdmins: !value,
          };
          break;
        case "giveCustomEditAccess":
          _edit = {
            ...edit,
            [key]: value,
            giveAllEditAccess: !value,
            editAccessToAllAdmins: !value,
          };
          break;

        default:
          break;
      }
      setValue("edit", _edit);
    };

    const debouncedPromiseOptions = debounce(
      (inputValue: string, callback: (options: any[]) => void) => {
        fetchUsers(inputValue, { page: 1, page_size: 100 }).then((users) => {
          callback(users); // Resolve with fetched users
        });
      },
      700,
    ); // 700ms debounce delay

    return (
      <div className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between">
            <div className="flex gap-x-2">
              <div>
                <input
                  type="radio"
                  id="step1"
                  checked={edit.editAccessToAllAdmins}
                  onChange={() =>
                    changeOption(
                      "editAccessToAllAdmins",
                      !edit.editAccessToAllAdmins,
                    )
                  }
                />
              </div>
              <div>
                <Label className="cursor-pointer" htmlFor="step1">
                  {translate(
                    "KEs.form.assignAccess.giveEditingPermission.onlyAdmins",
                  )}
                </Label>
              </div>
            </div>
            <div className="cursor-pointer">
              <Popover
                position="bottom"
                content={
                  <div className="w-96">
                    {translate(
                      "KEs.form.assignAccess.giveEditingPermission.onlyAdminsHelpInfo",
                    )}
                  </div>
                }
                trigger={<img src={allImgPaths.infoHint} alt="" />}
              ></Popover>
            </div>
          </div>
          <div>
            <span className="ml-5 text-sm italic text-tertiary-400">
              {translate(
                "KEs.form.assignAccess.giveEditingPermission.onlyAdminsHelpInfo",
              )}
            </span>
          </div>
        </div>
        {/* <div>
          <Divider className="!bg-tertiary-50" label="OR" />
        </div> */}
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between">
            <div className="flex gap-x-2">
              <div>
                <input
                  type="radio"
                  id="step2"
                  checked={edit.giveAllEditAccess}
                  onChange={() =>
                    changeOption("giveAllEditAccess", !edit.giveAllEditAccess)
                  }
                />
              </div>
              <div>
                <Label className="cursor-pointer" htmlFor="step2">
                  {translate(
                    "KEs.form.assignAccess.giveEditingPermission.allQueueSupporters",
                  )}
                </Label>
              </div>
            </div>
            <div className="cursor-pointer">
              <Popover
                position="bottom"
                content={
                  <div className="w-96">
                    {translate(
                      "KEs.form.assignAccess.giveEditingPermission.allQueueSupportersHelpInfo",
                    )}
                  </div>
                }
                trigger={<img src={allImgPaths.infoHint} alt="" />}
              ></Popover>
            </div>
          </div>
          <div>
            <span className="ml-5 text-sm italic text-tertiary-400">
              {translate(
                "KEs.form.assignAccess.giveEditingPermission.allQueueSupportersCaption",
              )}
            </span>
          </div>
        </div>
        {/* <div>
          <Divider className="!bg-tertiary-50" label="OR" />
        </div> */}
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between">
            <div className="flex gap-x-2">
              <div>
                <input
                  type="radio"
                  id="step3"
                  checked={edit.giveCustomEditAccess}
                  onChange={() =>
                    changeOption(
                      "giveCustomEditAccess",
                      !edit.giveCustomEditAccess,
                    )
                  }
                />
              </div>
              <div>
                <Label className="cursor-pointer" htmlFor="step3">
                  {translate(
                    "KEs.form.assignAccess.giveEditingPermission.queueSupportersByName",
                  )}
                </Label>
              </div>
            </div>
            <div className="cursor-pointer">
              <Popover
                position="bottom"
                content={
                  <div className="w-96">
                    {translate(
                      "KEs.form.assignAccess.giveEditingPermission.queueSupportersByNameHelpInfo",
                    )}
                  </div>
                }
                trigger={<img src={allImgPaths.infoHint} alt="" />}
              ></Popover>
            </div>
          </div>
          <div>
            <span className="ml-5 text-sm italic text-tertiary-400">
              {translate(
                "KEs.form.assignAccess.giveEditingPermission.queueSupportersByNameCaption",
              )}
            </span>
          </div>
          <div>
            <SelectComponent
              isAsync
              value={usersEditAccess}
              isLoading={isLoadingUsers}
              menuPortalTarget={document.body}
              isMulti
              isDisabled={!edit.giveCustomEditAccess}
              name="users"
              menuPlacement="top"
              placeholder={translate(
                "KEs.form.assignAccess.giveEditingPermission.byNamePlaceholder",
              )}
              className="w-full"
              defaultOptions
              cacheOptions={users}
              loadOptions={debouncedPromiseOptions}
              chipColor="#D9F0F9"
              components={{
                Option: UserListOption,
                ClearIndicator: ClearIndicator,
                DropdownIndicator: () => null,
                IndicatorSeparator: () => null,
              }}
              onChange={(data: any) => {
                setValue("usersEditAccess", data);
              }}
            />
          </div>
        </div>
      </div>
    );
  },
);

const AccessControl = ({
  setValue,
  getValues,
  formValues,
  onClose,
  onApply,
}: {
  setValue: any;
  getValues: any;
  formValues: any;
  onClose: () => void;
  onApply?: () => void;
}) => {
  const [selectedTab, setSelectedTab] = useState(1);

  const { translate } = useTranslate();

  const ACCESS_TYPE_TABS = [
    {
      label: (
        <div className="flex gap-x-2">
          <img
            src={allImgPaths.eyeIconWhite}
            alt=""
            className="group-[.active]:contrast-100 contrast-50"
          />
          {translate("KEs.form.assignAccess.giveViewingPermission.label")}
        </div>
      ),
      value: 1,
    },
    {
      label: (
        <div className="flex gap-x-2">
          <img
            src={allImgPaths.editIconWhite}
            alt=""
            className="group-[.active]:contrast-100 contrast-50"
          />
          {translate("KEs.form.assignAccess.giveEditingPermission.label")}
        </div>
      ),
      value: 2,
    },
  ];

  return (
    <div className="overflow-auto flex flex-col justify-center sm:h-screen sm:w-screen lg:h-auto lg:w-auto lg:max-h-[80vh]">
      <div className="flex gap-x-5 justify-between items-center p-6 border-b border-gray-300 sm:p-5">
        <div>
          <span className="font-medium">
            {translate("KEs.form.assignAccess.heading")}
          </span>
        </div>
        <div className="flex gap-x-1 items-center">
          <img src={allImgPaths.info} alt="" />
          <LabelInfo>{translate("KEs.form.assignAccess.infoText")}</LabelInfo>
        </div>
      </div>
      <div className="flex justify-between sm:px-5 sm:py-3">
        <Tabs
          options={ACCESS_TYPE_TABS}
          selected={selectedTab}
          onChange={(selected) => {
            setSelectedTab(selected);
          }}
        />
        <div>
          <div
            className="flex gap-x-2 items-center p-2 bg-white duration-200 cursor-pointer"
            onClick={() => {
              let width = Math.min(window.innerWidth * 0.8, 1200); // 80% width, max 1200px
              const height = screen.height; // Full height of the screen

              // Calculate center position
              const left = (screen.width - width) / 2;
              const top = 0; // Start from the top since it's 100% height

              if (window.innerWidth < 768) {
                width = window.innerWidth;
              }

              (window as any)
                .open(
                  FORM_LINK,
                  "_blank",
                  `location=yes,height=${height},width=${width},scrollbars=yes,status=yes,top=${top},left=${left}`,
                )
                .focus();
            }}
          >
            {/* <img src={allImgPaths.message} /> */}
            <img src={allImgPaths.feedbackIcon} alt="" />
            <span className="font-normal text-status-info">
              {translate("KEs.form.assignAccess.provideFeedback")}
            </span>
          </div>
        </div>
      </div>
      <div className="flex overflow-auto flex-col gap-y-5 align-top sm:p-5 sm:w-full">
        {selectedTab === 1 && (
          <ViewPermission
            setValue={setValue}
            getValues={getValues}
            formValues={formValues}
          />
        )}

        {selectedTab === 2 && (
          <EditPermission
            setValue={setValue}
            getValues={getValues}
            formValues={formValues}
          />
        )}
      </div>
      <div className="flex justify-end pt-4 border-t border-gray-300 sm:p-5">
        <div className="flex gap-x-5 justify-end">
          <ButtonV2
            variant="tertiaryDark"
            className="min-w-24"
            onClick={() => {
              confirmAlert({
                customUI: ({ onClose: onCloseConfirm }) => {
                  return (
                    <Modal size="md" show={true} onClose={onClose}>
                      <div className="flex flex-col gap-y-10">
                        <div>
                          <div className="mt-4">
                            <p className="text-base font-medium text-center">
                              {translate(
                                "KEs.form.assignAccess.confirmMessage",
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-x-5 justify-center">
                          <div>
                            <ButtonV2
                              onClick={() => {
                                onCloseConfirm();
                                onClose();
                              }}
                              variant="tertiaryDark"
                            >
                              {translate("common.discardChanges")}
                            </ButtonV2>
                          </div>
                          <div>
                            <ButtonV2
                              onClick={onCloseConfirm}
                              variant="primary"
                              rightIcon={allImgPaths.rightArrow}
                            >
                              {translate("common.keepEditing")}
                            </ButtonV2>
                          </div>
                        </div>
                      </div>
                    </Modal>
                  );
                },
                closeOnEscape: false,
                closeOnClickOutside: false,
              });
            }}
          >
            {translate("common.cancel")}
          </ButtonV2>
          <ButtonV2
            onClick={() => {
              onApply ? onApply() : onClose();
            }}
            variant="secondary"
            className="min-w-44"
          >
            {translate("common.apply")}
          </ButtonV2>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AccessControl);
