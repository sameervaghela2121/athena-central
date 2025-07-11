import { yupResolver } from "@hookform/resolvers/yup";
import { AnimatePresence, motion } from "framer-motion";
import { debounce, filter, isEqual, map, size } from "lodash-es";
import queryString from "query-string";
import { useEffect, useState } from "react";
import { get, useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

import api from "@/apis/axiosInterceptor";
import allImgPaths from "@/assets";
import {
  ButtonV2,
  ClearIndicator,
  Divider,
  DrawerFooter,
  ErrorText,
  Input,
  KeywordSelector,
  Label,
  LabelInfo,
  LoaderCircle,
  SelectComponent,
  Textarea,
  UserListOption,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { HOST, MODULE_TYPE } from "@/shared/constants";
import { QueueSchema } from "@/validations";

const Create = ({ onClose }: { onClose: () => void }) => {
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [data, setData] = useState<any>({});
  const [direction, setDirection] = useState<"UP" | "DOWN">("UP");

  const location = useLocation();
  const { translate } = useTranslate();

  const {
    createQueues,
    updateQueues,
    isCreating,
    isUpdating,
    fetchQueueById,
    isFetching,
  } = useAppState(RootState.QUEUES);
  // const { languagesList, isLoadingLanguages } = useAppState(RootState.COMMON);

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
      assigned_users: [],
      // languages: [],
      keywords: [],
      aging_threshold: 0,
      escalation_manager: undefined,
    },
    mode: "all",
    reValidateMode: "onChange",
    resolver: yupResolver(QueueSchema),
  });

  console.error("Queues errors =>", errors);

  const queryParams = new URLSearchParams(location.search);
  const queueId = queryParams.get("queueId");

  const {
    aging_threshold = 0,
    escalation_manager,
    assigned_users,
    // languages,
  } = watch();

  const fetchUsers = async (
    search: string = "",
    pagination?: {
      page_size: 100;
      page: 1;
      assigned_users?: boolean;
    },
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

      const result = get(data, "data.result", []).map((user: any) => ({
        label: `${user.name} (${user.username})`,
        email: user.email,
        value: user.id,
        ...user,
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

  const fetchQueue = async (queueId: string) => {
    try {
      const result = await fetchQueueById(queueId);

      setValue("name", result.name);
      setValue("description", result.description);
      setValue(
        "keywords",
        result.keywords.map((o: any) => {
          return { label: o, value: o };
        }),
      );

      setValue("aging_threshold", result.aging_threshold);

      setData(result);
    } catch (error) {
      console.error("fetchQueue error =>", error);
    }
  };

  // useEffect(() => {
  //   if (size(languagesList) && size(data)) {
  //     const selectedLangs = get(data, "languages", []);

  //     const filteredLanguages = languagesList.filter((language: any) =>
  //       selectedLangs.includes(language.value),
  //     );

  //     setValue("languages", filteredLanguages);
  //   }
  // }, [languagesList, data]);

  useEffect(() => {
    if (size(users) && size(data)) {
      const assignedUsers = filter(get(data, "assigned_users", []));

      const escalationManager = get(data, "escalation_manager", null);

      setValue(
        "assigned_users",
        assignedUsers.map((o: any) => {
          return {
            label: `${o.name} (${o.username})`,
            value: o.id,
            email: o.email ?? "N/A",
          };
        }),
      );

      if (escalationManager && escalationManager.id && escalationManager.name) {
        setValue("escalation_manager", {
          label: `${escalationManager?.name} (${escalationManager?.username})`,
          value: escalationManager?.id,
          email: escalationManager?.email ?? "-",
        });
      }
    }
  }, [data]);

  useEffect(() => {
    (async () => {
      await fetchUsers();
    })().then(() => {
      if (queueId) fetchQueue(queueId);
    });
  }, [queueId]);

  const updateAgingDays = (count: number) => {
    const _aging_threshold = aging_threshold + count;

    if (_aging_threshold < 0) return;

    setValue("aging_threshold", _aging_threshold, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: any) => {
    const keywords = map(data.keywords, "label");
    const languages = map(data.languages, "label");
    const assigned_users = map(data.assigned_users, "value");
    const escalation_manager = get(data, "escalation_manager.value", null);

    const payload = {
      ...data,
      keywords,
      languages,
      assigned_users,
      escalation_manager,
    };

    try {
      if (queueId) {
        await updateQueues(queueId, payload);
        toast.success("Queue updated successfully", {
          id: "success-queue-updated",
        });
      } else {
        await createQueues(payload);
        toast.success("Queue created successfully", {
          id: "success-queue-added",
        });
      }
      onClose();
    } catch (error) {
      toast.error("Something went wrong, please try after sometime");
      console.error("error =>", error);
    }
  };

  if (isFetching)
    return (
      <div className="mt-80">
        <LoaderCircle />
      </div>
    );

  const debouncedPromiseOptionsForAssignedUsers = debounce(
    (inputValue: string, callback: (options: any[]) => void) => {
      fetchUsers(inputValue, {
        page: 1,
        page_size: 100,
        assigned_users: true,
      }).then((users) => {
        callback(users); // Resolve with fetched users
      });
    },
    700,
  );

  const debouncedPromiseOptionsForEscalationManager = debounce(
    (inputValue: string, callback: (options: any[]) => void) => {
      fetchUsers(inputValue, { page: 1, page_size: 100 }).then((users) => {
        callback(users); // Resolve with fetched users
      });
    },
    700,
  );

  const { is_system_generated: disabled = false } = data;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      autoComplete="off"
      className="flex relative flex-col justify-between w-full"
    >
      <div className="h-[calc(100vh_-_158px)] overflow-auto flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-10 p-8 w-full rounded-2xl">
          <div className="flex gap-x-4">
            <div className="flex-none w-2/6">
              <div className="flex flex-col">
                <div>
                  <Label className="font-medium">
                    {translate("queues.form.queueNameAndDescription.label")}
                  </Label>
                </div>
                <div>
                  <LabelInfo>
                    {translate("queues.form.queueNameAndDescription.caption")}
                  </LabelInfo>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-y-4 grow">
              <div>
                <Input
                  disabled={disabled}
                  name="name"
                  placeholder={translate(
                    "queues.form.queueNameAndDescription.name",
                  )}
                  className="w-full"
                  control={control}
                  errors={errors}
                />
              </div>
              <div>
                <Textarea
                  disabled={disabled}
                  name="description"
                  control={control}
                  rows={4}
                  type="textarea"
                  placeholder={translate(
                    "queues.form.queueNameAndDescription.description",
                  )}
                  errors={errors}
                  maxChar={500}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-x-4">
            <div className="flex-none w-2/6">
              <div className="flex flex-col">
                <div>
                  <Label className="font-medium">
                    {translate("queues.form.suggestedKeywordsForQueue.label")}
                  </Label>
                </div>
                <div>
                  <LabelInfo>
                    {translate("queues.form.suggestedKeywordsForQueue.caption")}
                  </LabelInfo>
                </div>
              </div>
            </div>
            <div className="flex flex-col grow">
              <div>
                <KeywordSelector
                  disabled={disabled}
                  name="keywords"
                  control={control}
                  placeholder={translate(
                    "queues.form.suggestedKeywordsForQueue.placeholder",
                  )}
                  errors={errors}
                />
              </div>

              <div>
                <LabelInfo>
                  {translate("queues.form.suggestedKeywordsForQueue.info")}
                </LabelInfo>
              </div>
            </div>
          </div>

          {/* <Divider />

          <div className="flex gap-x-4">
            <div className="flex-none w-2/6">
              <div className="flex flex-col">
                <div>
                  <Label className="font-medium">
                    {translate("queues.form.attributes.label")}
                  </Label>
                </div>
                <div>
                  <LabelInfo>
                    {translate("queues.form.attributes.caption")}
                  </LabelInfo>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-y-4 grow">
              <div>
                <SelectComponent
                  value={languages}
                  isMulti
                  isLoading={isLoadingLanguages}
                  name="languages"
                  placeholder={translate(
                    "queues.form.attributes.languagePlaceholder",
                  )}
                  options={languagesList}
                  onChange={(data: any) => {
                    if (isEqual(languages, data)) {
                      setValue("languages", [] as any, {
                        shouldValidate: true,
                      });
                    } else {
                      setValue("languages", data, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  errors={errors}
                />

                <div>
                  <LabelInfo>
                    {translate("queues.form.attributes.languageInfo")}
                  </LabelInfo>
                </div>
              </div>
            </div>
          </div> */}

          <Divider />

          <div className="flex gap-x-4">
            <div className="flex-none w-2/6">
              <div className="flex flex-col">
                <div>
                  <Label className="font-medium">
                    {translate("queues.form.assignUsers.label")}
                  </Label>
                </div>
                <div>
                  <LabelInfo>
                    {translate("queues.form.assignUsers.caption")}
                  </LabelInfo>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-y-4 grow">
              <div>
                <SelectComponent
                  isAsync
                  menuPlacement="top"
                  value={assigned_users}
                  isLoading={isLoadingUsers}
                  isMulti
                  name="assigned_users"
                  placeholder={translate(
                    "queues.form.assignUsers.assignUsersPlaceholder",
                  )}
                  defaultOptions
                  cacheOptions={users}
                  loadOptions={debouncedPromiseOptionsForAssignedUsers}
                  chipColor="#D9F0F9"
                  components={{
                    Option: UserListOption,
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                    ClearIndicator: ClearIndicator,
                  }}
                  onChange={(data: any) => {
                    setValue("assigned_users", data, {
                      shouldValidate: true,
                    });
                  }}
                  errors={errors}
                />

                <div>
                  <LabelInfo>
                    {translate("queues.form.assignUsers.assignUsersInfo")}
                  </LabelInfo>
                </div>
              </div>
              <div>
                <SelectComponent
                  isAsync
                  menuPlacement="top"
                  value={escalation_manager}
                  isLoading={isLoadingUsers}
                  name="escalation_manager"
                  placeholder={translate(
                    "queues.form.assignUsers.escalationPlaceholder",
                  )}
                  chipColor="#D9F0F9"
                  closeMenuOnSelect
                  defaultOptions
                  cacheOptions={users}
                  loadOptions={debouncedPromiseOptionsForEscalationManager}
                  components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                    ClearIndicator: ClearIndicator,
                    Option: UserListOption,
                  }}
                  onChange={(data: any) => {
                    if (isEqual(escalation_manager, data)) {
                      setValue("escalation_manager", null as any, {
                        shouldValidate: true,
                      });
                    } else {
                      setValue("escalation_manager", data, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  errors={errors}
                />

                <div>
                  <LabelInfo>
                    {translate("queues.form.assignUsers.escalationInfo")}
                  </LabelInfo>
                </div>
              </div>
              <div>
                <div className="relative">
                  <Input
                    name="aging_threshold"
                    onChange={(e) => {
                      const value = e.target.value;

                      if (!isNaN(+value) && value.length <= 3) {
                        setValue("aging_threshold", +value, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    placeholder={translate(
                      "queues.form.assignUsers.thresholdDayPlaceholder",
                    )}
                    value={`${aging_threshold || ""}`}
                  />
                  <div className="flex absolute right-0 top-1/2 gap-x-2 justify-between items-center transform -translate-x-4 -translate-y-1/2">
                    <button
                      disabled={aging_threshold === 0}
                      onMouseEnter={() => {
                        setDirection("DOWN");
                      }}
                      onClick={() => {
                        updateAgingDays(-1);
                      }}
                      type="button"
                      className="rounded-[4px] border border-tertiary-200 h-6 w-6 outline-none p-1 flex items-center justify-center"
                    >
                      <img src={allImgPaths.minus} alt="" />
                    </button>

                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={aging_threshold ? aging_threshold : "empty"}
                        initial={{
                          y: direction === "UP" ? 20 : -20,
                          opacity: 0,
                          scale: 1,
                        }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{
                          y: direction === "UP" ? -20 : 20,
                          opacity: 0,
                          scale: 1,
                        }}
                        transition={{ duration: 0.2, ease: "backOut" }}
                        style={{ width: 30, textAlign: "center" }}
                      >
                        <span className="p-1 text-base">{aging_threshold}</span>
                      </motion.div>
                    </AnimatePresence>

                    <button
                      onMouseEnter={() => {
                        setDirection("UP");
                      }}
                      onClick={() => {
                        updateAgingDays(1);
                      }}
                      type="button"
                      className="rounded-[4px] border border-tertiary-200 h-6 w-6 outline-none p-1 flex items-center justify-center"
                    >
                      <img src={allImgPaths.plus} alt="" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div>
                    <ErrorText errors={errors} name={"aging_threshold"} />
                  </div>
                  <div>
                    <LabelInfo>
                      {translate("queues.form.assignUsers.thresholdDayInfo")}
                    </LabelInfo>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DrawerFooter>
        <div className="flex justify-end w-full">
          <ButtonV2
            type="submit"
            // disabled={isSubmitting || !isValid}
            color="primary"
            loading={isUpdating || isCreating}
            rightIcon={allImgPaths.rightArrow}
          >
            {queueId
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
