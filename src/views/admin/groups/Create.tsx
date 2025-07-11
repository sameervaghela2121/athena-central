import request from "@/apis/KE";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  cloneDeep,
  debounce,
  get,
  has,
  includes,
  isEqual,
  map,
  omit,
  size,
  some,
  toLower,
  values,
} from "lodash-es";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";

import api from "@/apis/axiosInterceptor";
import allImgPaths from "@/assets";
import {
  ButtonV2,
  ClearIndicator,
  Divider,
  DrawerFooter,
  ErrorText,
  Input,
  Label,
  Loader,
  LoaderCircle,
  SelectComponent,
  Textarea,
  UserListOption,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { HOST } from "@/shared/constants";
import { GroupSchema } from "@/validations";
import queryString from "query-string";
import { toast } from "sonner";

const Create = ({ onClose }: { onClose: () => void }) => {
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [data, setData] = useState<any>({});
  const [groupAttribute, setGroupAttribute] = useState<any[]>([]);
  const [isLoadingAttributesCount, setIsLoadingAttributesCount] =
    useState(false);

  const location = useLocation();
  const { translate } = useTranslate();

  const {
    updateGroup,
    createGroup,
    fetchGroupById,
    fetchGroupAttribute,
    isFetching,
    isUpdating,
    isCreating,
  } = useAppState(RootState.GROUPS);

  const {
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
    getValues,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      attributes: {},
      attributes_access: [],
      users_access: [],
    },
    mode: "onChange",
    resolver: yupResolver(GroupSchema),
  });

  const queryParams = new URLSearchParams(location.search);
  const groupId = queryParams.get("groupId");

  const { attributes, users_access = [], attributes_access } = watch();

  const fetchUsers = async (name?: string) => {
    try {
      setIsLoadingUsers(true);

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
        value: user._id ?? user.id,
      }));
      setUsersList(result);

      return result;
    } catch (error) {
      console.error("error =>", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchGroup = async (groupId: string) => {
    try {
      const result = await fetchGroupById(groupId);

      const usersAccess = get(result, "users", []).map((user: any) => ({
        label: `${user.name} (${user.username})`,
        email: user.email,
        value: user.id,
      }));

      setValue("name", result.name);
      setValue("description", result.description);
      setValue("users_access", usersAccess);

      const attributes = [];
      if (size(result.attributes) > 0) {
        for (const att of result.attributes) {
          const attPayload = omit(att, "count");
          const { result: listOfAttributeUserIds } =
            await request.fetchUsersCountByAttribute({
              attributes: [attPayload],
            });

          attributes.push({ ...att, count: listOfAttributeUserIds.length });
        }
      }
      setValue("attributes_access", attributes);

      setData(result);
    } catch (error) {
      console.error("error =>", error);
    }
  };

  const fetchAttribute = async () => {
    try {
      const result = await fetchGroupAttribute();
      setGroupAttribute(result);
    } catch (error) {
      console.error("error =>", error);
    }
  };

  useEffect(() => {
    if (!groupId) fetchAttribute();
  }, []);

  useEffect(() => {
    if (groupId)
      fetchGroup(groupId).then(() => {
        fetchAttribute();
      });
  }, [groupId]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: any) => {
    const {
      name,
      description,
      users_access = [],
      attributes_access = [],
    } = data;

    const payload: any = {
      name,
      description,
    };

    payload.users = map(users_access, "value");

    payload.attributes = attributes_access.map((attributes: any) => {
      return omit(attributes, "count");
    });

    try {
      if (groupId) {
        const { message } = await updateGroup(groupId, payload);

        toast.success(message, {
          id: "success-group-updated",
        });
      } else {
        const { message } = await createGroup(payload);
        toast.success(message, {
          id: "success-group-added",
        });
      }

      onClose();
    } catch (error) {
      console.error("error =>", error);

      const err = get(
        error,
        "response.data.data.message",
        "Something went wrong, please try again",
      );

      toast.error(err);
      console.error("error =>", error);
    }
  };

  const debouncedPromiseOptions = debounce(
    (inputValue: string, callback: (options: any[]) => void) => {
      fetchUsers(inputValue).then((users) => {
        callback(users); // Resolve with fetched users
      });
    },
    700,
  ); // 700ms debounce delay

  if (isFetching)
    return (
      <div className="mt-80">
        <LoaderCircle />
      </div>
    );

  const customFilterOption = (
    option: { label: string; value: string; data: any },
    inputValue: string,
  ) => {
    const { label, data } = option;
    const email = data.email || "";
    const searchTarget = `${label} ${email}`;

    return includes(toLower(searchTarget), toLower(inputValue));
  };

  const addAttribute = () => {
    const { attributes, attributes_access = [] } = getValues();
    const exists = some(attributes_access, (obj) => isEqual(obj, attributes));

    if (!exists) {
      attributes_access.push(attributes);
      setValue("attributes_access", attributes_access, {
        shouldValidate: true,
      });
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
    setValue("attributes_access", attributes_access, { shouldValidate: true });
  };

  const searchedAttributesValues = () => {
    const { attributes } = getValues();
    const _attributes = omit(attributes, "count");
    const users = get(attributes, "count", 0);
    const allValues = values(_attributes);

    if (users <= 0) return;
    const msg = `${users} Users (${allValues.join(" / ")})`;

    return (
      <div className="flex flex-col items-center gap-y-1">
        <span>{msg}</span>
        <span className="font-medium text-tertiary-400"></span>
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      autoComplete="off"
      className="relative h-[calc(100vh_-_74px)]"
    >
      <div className="relative flex justify-center w-full h-full overflow-y-auto px-14 py-9">
        <div className="flex flex-col w-full rounded-2xl gap-y-10">
          <div className="flex gap-x-4">
            <div className="flex-none w-2/6">
              <div className="flex flex-col">
                <div>
                  <span className="text-base font-medium">
                    {translate(
                      "admin.groups.form.groupNameAndDescription.label",
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-sm italic text-tertiary-400">
                    {translate(
                      "admin.groups.form.groupNameAndDescription.caption",
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col grow gap-y-4">
              <div>
                <Input
                  name="name"
                  placeholder={translate(
                    "admin.groups.form.groupNameAndDescription.name-placeholder",
                  )}
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
                    "admin.groups.form.groupNameAndDescription.description",
                  )}
                  errors={errors}
                  maxChar={200}
                />
              </div>
            </div>
          </div>

          <Divider />

          {/* access control section */}
          <div className="flex flex-col grow gap-y-4">
            <div className="flex flex-col">
              <Label>Add Members to Group</Label>
              <span className="text-sm italic text-tertiary-400">
                Select users manually or filter by attributes to add to this
                Group, ensuring accurate member assignment.
              </span>
            </div>

            <div className="p-4 rounded-lg shadow-md">
              {/* Add Specific People to this Group */}
              <div className="flex flex-col gap-y-4">
                <div className="flex items-baseline gap-x-2">
                  <div className="flex flex-col">
                    <label
                      className="cursor-pointer select-none"
                      htmlFor="BY_SPECIFIC_PEOPLE"
                    >
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
                        value={users_access}
                        isLoading={isLoadingUsers}
                        isMulti
                        filterOption={customFilterOption}
                        name="users_access"
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
                          setValue("users_access", data, {
                            shouldValidate: true,
                          });
                        }}
                      />
                    </div>
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
                              let _attributes: any = cloneDeep(attributes);

                              if (get(data, "value")) {
                                _attributes = {
                                  ..._attributes,
                                  [attribute.name]: get(data, "value"),
                                };
                              } else {
                                _attributes = omit(_attributes, [
                                  attribute.name,
                                  "count",
                                ]);
                              }

                              const payload = omit(_attributes, [
                                "permissions",
                                "count",
                              ]);

                              if (size(payload) > 0) {
                                setIsLoadingAttributesCount(true);
                                request
                                  .fetchUsersCountByAttribute({
                                    attributes: [payload],
                                  })
                                  .then(({ result }) => {
                                    setValue("attributes", {
                                      ..._attributes,
                                      count: result.length,
                                    });
                                  })
                                  .catch((err) => {
                                    setValue("attributes", {
                                      ..._attributes,
                                      count: 0,
                                    });
                                  })
                                  .finally(() => {
                                    setIsLoadingAttributesCount(false);
                                  });
                              } else {
                                setValue("attributes", _attributes);
                              }

                              setValue(attribute.name, data);
                            }}
                            errors={errors}
                          />
                        </div>
                      ))}
                    </div>

                    {/* add new member by attribute */}
                    {isLoadingAttributesCount ? (
                      <div className="flex flex-col p-3 mt-8 shadow-md gap-y-2">
                        <Loader count={1} height={32} />
                      </div>
                    ) : size(searchedAttributesValues()) > 0 &&
                      size(attributes) > 0 ? (
                      <div className="flex flex-col p-3 mt-8 shadow-md gap-y-2">
                        <div className="flex items-center justify-between w-full">
                          <div>{searchedAttributesValues()}</div>
                          <div className="flex justify-end">
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
                    ) : (
                      size(attributes) > 0 && (
                        <div className="flex flex-col p-3 gap-y-2 text-status-error">
                          No users found, please try other attributes.
                        </div>
                      )
                    )}

                    <div className="flex flex-col p-3 gap-y-2">
                      {has(errors, "users_access.message") &&
                        has(errors, "attributes_access.message") && (
                          <ErrorText errors={errors} name="attributes_access" />
                        )}
                      {attributes_access?.map(
                        (attributes: any, index: number) => (
                          <div className="flex justify-between" key={index}>
                            <div>
                              {attributes.count && (
                                <span className="mr-3">
                                  {attributes.count} Users
                                </span>
                              )}
                              <span className="font-medium text-tertiary-400">
                                {values(omit(attributes)).join(" / ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-x-1">
                              <div
                                onClick={() => removeAttribute(index)}
                                className="p-2 duration-500 rounded-full cursor-pointer hover:bg-status-error/20"
                              >
                                <img src={allImgPaths.trash} alt="" />
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <DrawerFooter className="absolute bottom-0">
        <div className="flex justify-end w-full">
          <ButtonV2
            type="submit"
            // disabled={isSubmitting || !isValid}
            color="primary"
            loading={isUpdating || isCreating}
            rightIcon={allImgPaths.rightArrow}
          >
            {groupId
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
