import allImgPaths from "@/assets";
import { ButtonV2, Checkbox, Empty, LoaderCircle, Modal } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";

import api from "@/apis/queues";
import SearchInput from "@/components/SearchInput";
import Tabs from "@/components/Tabs";
import { useDebounce, useTranslate } from "@/hooks";
import { QUEUE_REROUTE_LIMIT } from "@/shared/constants";
import {
  chain,
  cloneDeep,
  concat,
  filter,
  find,
  get,
  reject,
  size,
  toLower,
} from "lodash-es";
import queryString from "query-string";
import { useCallback, useEffect, useMemo, useState } from "react";
import Highlighter from "react-highlight-words";
import { toast } from "sonner";
import SuccessReRoute from "./SuccessReRoute";

const QueueAndEntityCard = ({
  data,
  selected,
  onSelect,
  search = "",
}: {
  data: any;
  selected: boolean;
  search?: string;
  onSelect: () => void;
}) => {
  return (
    <div
      onClick={onSelect}
      className={`rounded-lg border flex gap-x-2 p-2 cursor-pointer ${selected ? "bg-primary-50/50 border-status-brand shadow-md" : "border-tertiary-200"}`}
    >
      <div className="flex items-center">
        <Checkbox onChange={() => {}} checked={selected} />
      </div>
      <div className="flex flex-col w-full">
        <div>
          <Highlighter
            className="text-sm font-semibold select-none text-primary-900"
            highlightClassName="bg-secondary-600 p-[1px] rounded"
            searchWords={[search]}
            autoEscape={true}
            textToHighlight={`${data.name} ${data.is_system_generated ? "(Default)" : ""}`}
          />
        </div>
        <div className="w-full" title={data.description}>
          <Highlighter
            className="text-xs select-none text-tertiary-900 line-clamp-1"
            highlightClassName="bg-secondary-600 p-[1px] rounded"
            searchWords={[search]}
            autoEscape={true}
            textToHighlight={get(data, "description", "")}
          />
        </div>
      </div>
    </div>
  );
};

const Reroute = ({
  onClose,
  onComplete,
  open,
  question,
}: {
  onClose: () => void;
  onComplete: () => void;
  open: boolean;
  question: any;
}) => {
  if (!open) return;

  const [search, setSearch] = useState<string>("");
  const [successRerouteQueues, setSuccessRerouteQueues] = useState("");
  const [step, setStep] = useState(0);
  const [selectedTab, setSelectedTab] = useState(1);
  const [selectedQueues, setSelectedQueues] = useState<any>([]);
  const [recentQueues, setRecentQueues] = useState<any[]>([]);
  const [suggestedQueues, setSuggestedQueues] = useState<any[]>([]);
  const [haveSuggestedQueues, setHaveSuggestedQueues] =
    useState<boolean>(false);
  const [entities, setEntities] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [isLoadingRecentQueues, setIsLoadingRecentQueues] = useState(false);
  const [isLoadingSuggestedQueues, setIsLoadingSuggestedQueues] =
    useState(false);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);

  const debouncedSearch: string | number = useDebounce(search, 500);

  const { translate } = useTranslate();
  const { reroutingQuestion, isRerouting = false } = useAppState(
    RootState.QUESTIONS,
  );
  const {
    user: { is_entity_enabled = false },
  } = useAppState(RootState.AUTH);
  const { id, queue_ids = [] } = question;
  const queueIds = new Set(queue_ids);

  const getRecentQueues = async () => {
    try {
      setIsLoadingRecentQueues(true);
      setRecentQueues([]);
      const recentQueues = await api.getRecentQueues();

      // Remove already selected queues into reroute queue list
      const result = reject(recentQueues, (queue) => queueIds.has(queue.id));

      setRecentQueues(result);
    } catch (error) {
      toast.error("something went wrong");
    } finally {
      setIsLoadingRecentQueues(false);
    }
  };

  const getSuggestedQueues = async (payload: any) => {
    try {
      setIsLoadingSuggestedQueues(true);
      setSuggestedQueues([]);

      const stringified = queryString.stringify(payload);
      const { data } = await api.fetchQueues(stringified);

      const queues = get(data, "data.result", []);

      // Remove already selected queues into reroute queue list
      const result = reject(queues, (queue) => queueIds.has(queue.id));

      if (size(payload.search_name) <= 0) {
        if (size(result) > 0) {
          setHaveSuggestedQueues(true);
        } else {
          setHaveSuggestedQueues(false);
        }
      }

      setSuggestedQueues(result);
    } catch (error) {
      console.error("getSuggestedQueues error =>", error);

      toast.error("something went wrong");
    } finally {
      setIsLoadingSuggestedQueues(false);
    }
  };

  const getEntities = async () => {
    try {
      setIsLoadingEntities(true);
      setEntities([]);

      const data = await api.getEntities();

      is_entity_enabled ? setEntities(data) : setEntities([]);
    } catch (error) {
      console.error("getEntities error =>", error);

      toast.error("something went wrong");
    } finally {
      setIsLoadingEntities(false);
    }
  };

  useEffect(() => {
    getRecentQueues();
    getEntities();
  }, []);

  useEffect(() => {
    getSuggestedQueues({
      search_name: debouncedSearch,
      sort_order: "desc",
      sort_field: "created_at",
      page: 1,
      page_size: 100,
    });
  }, [debouncedSearch]);

  const onReroute = async () => {
    try {
      const payload = {
        feedback: "",
        queue_ids: selectedQueues,
        entity_names: selectedEntities,
      };

      const result = await reroutingQuestion(id, payload);

      if (result) {
        try {
          const names: any = chain(
            concat(recentQueues, suggestedQueues).filter((item: any) =>
              selectedQueues.includes(item.id),
            ),
          )
            .map("name")
            .uniq()
            .value()
            .concat(selectedEntities)
            .join(", ");

          setSuccessRerouteQueues(names);
        } catch (error) {
          console.error("onReroute error =>", error);
        } finally {
          setStep(1);
        }
      }
    } catch (error: any) {
      console.error("onReroute error =>", error);

      toast.error(
        get(error, "response.data.errors", "Error while submitting feedback!"),
        {
          id: "reroute-question",
        },
      );
    }
  };

  const onSelectQueue = (queueId: string) => {
    const _selectedQueues = cloneDeep(selectedQueues);
    const index = _selectedQueues.indexOf(queueId);

    if (index >= 0) {
      _selectedQueues.splice(index, 1);
    } else {
      _selectedQueues.push(queueId);
    }

    if (size(_selectedQueues) > QUEUE_REROUTE_LIMIT) {
      toast.info(`Only ${QUEUE_REROUTE_LIMIT} queue(s) can be assigned!`, {
        id: "duplicate-queue",
      });
      return;
    }

    setSelectedQueues(_selectedQueues);
    // setSelectedEntities([]);
  };

  const onCloseSuccess = useCallback(() => {
    setSearch("");
    setStep(0);
    setSelectedQueues({});
    onComplete();
  }, []);

  const addOrRemoveEntities = (entity: string) => {
    if (selectedEntities.includes(entity)) {
      setSelectedEntities([]);
    } else {
      setSelectedEntities([entity]);
    }

    // setSelectedQueues([]);
  };

  const filteredRecentQueues: any = useMemo(() => {
    if (search) {
      return filter(recentQueues, (queue: any) =>
        toLower(queue?.name).includes(toLower(search)),
      );
    } else {
      return recentQueues;
    }
  }, [search, recentQueues]);

  const filteredEntities = useMemo(() => {
    if (!search) return entities;

    const lowerCaseSearch = toLower(search);

    return filter(entities, (entity: any) =>
      toLower(entity).includes(lowerCaseSearch),
    );
  }, [search, entities]);

  const ACCESS_TYPE_TABS = useMemo(() => {
    let options = [
      { label: translate("questions.reroute.tabs.recent"), value: 1 },
      { label: translate("questions.reroute.tabs.allQueues"), value: 2 },
      { label: translate("questions.reroute.tabs.organizations"), value: 3 },
    ];

    options = options.filter((option) => {
      if (option.value === 1) return size(recentQueues) > 0;
      if (option.value === 2) return haveSuggestedQueues;
      if (option.value === 3) return size(entities) > 0 && is_entity_enabled;
      return true;
    });

    return options;
  }, [recentQueues, entities, is_entity_enabled, search, haveSuggestedQueues]);

  const _selectedTab = useMemo(() => {
    if (!find(ACCESS_TYPE_TABS, { value: selectedTab })) {
      return ACCESS_TYPE_TABS[0]?.value ?? 1;
    } else {
      return selectedTab;
    }
  }, [
    selectedTab,
    ACCESS_TYPE_TABS,
    recentQueues,
    suggestedQueues,
    entities,
    search,
  ]);

  return (
    <div>
      <Modal onClose={onClose} show={open} size="lg" extraClasses="!p-0">
        {step === 0 ? (
          <>
            <Modal.Header>
              <div>
                <span className="text-xl font-medium">
                  {is_entity_enabled
                    ? translate("questions.reroute.title-queues-or-org")
                    : translate("questions.reroute.title-queues")}
                </span>
              </div>
              <div className="flex mt-4 gap-x-5">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  className="w-full"
                  placeholder={
                    selectedTab === 3
                      ? translate(
                          "questions.reroute.search-organization-placeholder",
                        )
                      : translate("questions.reroute.search-placeholder")
                  }
                />
              </div>
            </Modal.Header>
            <div className="flex flex-col p-4 gap-y-4">
              {/* recent and suggest queues section */}
              <div className="flex flex-col">
                <Tabs
                  className="shadow-none !p-0 flex gap-x-1 mb-4"
                  options={ACCESS_TYPE_TABS}
                  selected={_selectedTab}
                  onChange={setSelectedTab}
                />
                <div className={`h-80 duration-200  flex flex-col gap-y-2`}>
                  {_selectedTab === 1 && (
                    <div className="">
                      <div
                        className={`mt-2 gap-y-2 pr-4 flex flex-col overflow-auto h-80`}
                      >
                        {isLoadingRecentQueues ? (
                          <div className="mt-10">
                            <LoaderCircle />
                          </div>
                        ) : size(filteredRecentQueues) > 0 ? (
                          filteredRecentQueues.map(
                            (queue: any, index: number) => (
                              <QueueAndEntityCard
                                key={index}
                                data={queue}
                                search={search}
                                onSelect={() => onSelectQueue(queue.id)}
                                selected={selectedQueues.includes(queue.id)}
                              />
                            ),
                          )
                        ) : (
                          <div className="flex justify-center text-lg font-medium">
                            <Empty
                              description={translate(
                                "questions.reroute.recentQueue",
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {_selectedTab === 2 && (
                    <div className="">
                      <div
                        className={`mt-2 pr-4 gap-y-2 flex flex-col overflow-auto h-80`}
                      >
                        {isLoadingSuggestedQueues ? (
                          <div className="mt-10">
                            <LoaderCircle />
                          </div>
                        ) : size(suggestedQueues) > 0 ? (
                          suggestedQueues.map((queue: any, index: number) => (
                            <QueueAndEntityCard
                              key={index}
                              data={queue}
                              search={search}
                              onSelect={() => onSelectQueue(queue.id)}
                              selected={selectedQueues.includes(queue.id)}
                            />
                          ))
                        ) : (
                          <div className="flex justify-center text-lg font-medium">
                            <Empty
                              description={translate(
                                "questions.reroute.queuesNotFound",
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {_selectedTab === 3 && (
                    <div className="">
                      <div
                        className={`mt-2 pr-4 gap-y-2 flex flex-col overflow-auto h-80`}
                      >
                        {isLoadingEntities ? (
                          <div className="mt-10">
                            <LoaderCircle />
                          </div>
                        ) : size(filteredEntities) > 0 ? (
                          filteredEntities.map((entity: any, index: number) => (
                            <QueueAndEntityCard
                              key={index}
                              data={{
                                name: entity,
                                is_system_generated: false,
                              }}
                              search={search}
                              onSelect={() => addOrRemoveEntities(entity)}
                              selected={selectedEntities.includes(entity)}
                            />
                          ))
                        ) : (
                          <div className="flex justify-center text-lg font-medium">
                            <Empty
                              description={translate(
                                "questions.reroute.organizationNotFound",
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-center p-4 pt-5 gap-x-2 gap-y-4">
              <ButtonV2 onClick={onClose} variant="tertiaryDark">
                {translate("common.cancel")}
              </ButtonV2>
              <ButtonV2
                disabled={size(selectedQueues) <= 0 && size(entities) <= 0}
                loading={isRerouting}
                onClick={onReroute}
                variant="primary"
                rightIcon={allImgPaths.rightArrow}
                className="text-center"
              >
                {translate("common.reroute-question")}
              </ButtonV2>
            </div>
          </>
        ) : (
          <SuccessReRoute
            onClose={onCloseSuccess}
            reroutedQueuesNames={successRerouteQueues}
          />
        )}
      </Modal>
    </div>
  );
};

export default Reroute;
