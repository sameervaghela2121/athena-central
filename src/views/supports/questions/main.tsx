import {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  cloneDeep,
  first,
  get,
  lowerCase,
  map,
  remove,
  size,
  startCase,
  toLower,
  upperCase,
} from "lodash-es";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import allImgPaths from "@/assets/index";
import {
  Chip,
  Loader,
  LoaderCircle,
  NoRecord,
  PermissionGate,
  Popover,
  RenderDate,
  Table,
  Tooltip,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { convertISTRangeToUTC } from "@/shared/functions";

import Dropdown from "@/components/Dropdown";
import UnauthorizedAccess from "@/components/UnauthorizedAccess";
import { useDebounce, useTranslate } from "@/hooks";
import {
  ACTION,
  EMPTY_CELL,
  LOADING_ROWS,
  PAGES,
  PRIORITIES,
  QUESTIONS_FILTER_OPTIONS,
  QUESTION_STATUS,
  TABLE,
} from "@/shared/constants";
import queryString from "query-string";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ActionGuide from "../components/ActionGuide";
import RejectQuestionForm from "../components/RejectQuestionForm";
import Reroute from "../components/Reroute";

type TableDataType = {
  created_at: string;
  priority: {
    id: number;
    name: string;
  };
  language: string;
  status: string;
  queues: string;
  question_text: string;
  asker: string;
  action?: any;
  id: string;
  conversation_id: string;
  created_by: any;
};

const columnHelper = createColumnHelper<TableDataType>();

const PAGE_SIZE = 10;

const Questions = ({
  currentEntityQueuesList = [],
  page = 0,
  myQueues = [],
}) => {
  const { lang, languagesList } = useAppState(RootState.COMMON);
  const {
    data = [],
    total,
    getQuestions,
    updateQuestions,
    isLoading,
  } = useAppState(RootState.QUESTIONS);

  const location = useLocation();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { translate } = useTranslate();

  const QUESTIONS_FILTER = useMemo(() => {
    return QUESTIONS_FILTER_OPTIONS.map((menu: any) => {
      return {
        ...menu,
        name: translate(`questions.filter.${menu.key}` as any),
      };
    });
  }, [QUESTIONS_FILTER_OPTIONS, lang]);

  const [showReject, setShowReject] = useState(false); // REJECT
  const [showReroute, setShowReroute] = useState(false); // REROUTE
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefresh, setIsRefresh] = useState(false);
  const [selectedQueueFilter, setSelectedQueueFilter] = useState<any>(
    QUESTIONS_FILTER[0],
  );

  const [selectedQuestion, setSelectedQuestion] = useState<any>({}); // store selected question info for action
  const [searchQueryString, setSearchQueryString] = useState(""); // search queryString for filter/sorting etc
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "status",
      value: [QUESTION_STATUS[0]],
    },
    {
      id: "priority",
      value: [{ value: 0, label: "All" }, ...PRIORITIES],
    },
    {
      id: "queues",
      value: [...myQueues],
    },
    {
      id: "language",
      value:
        languagesList.length > 0
          ? [{ value: 0, label: "All" }, ...languagesList]
          : [],
    },
  ]);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: page,
    pageSize: PAGE_SIZE,
  });

  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "created_at",
      desc: true,
    },
  ]);

  const debouncedSearchParams = useDebounce(searchQueryString, 500);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    setPagination({
      pageIndex: page,
      pageSize: PAGE_SIZE,
    });
  }, [columnFilters]);

  //#region
  useEffect(() => {
    const _pagination = cloneDeep(pagination);
    let filters: any = {
      status: "Open",
      language: null,
      priority: null,
      search_description: null,
      search_question: null,
      sort_field: "created_at",
      sort_order: "desc",
      start_date: "",
      end_date: "",
      queue_ids: null,
      page_size: _pagination.pageSize,
      page: _pagination.pageIndex + 1,
    };

    columnFilters.forEach((filter: any) => {
      switch (filter.id) {
        case "question_text":
          filters.search_question = filter?.value;
          break;
        case "language": {
          {
            const labels = map(filter.value, "label");

            if (!labels.includes("All")) {
              remove(filter.value, (option: any) => option.value === 0);
              const labels = map(filter.value, "label");
              filters.language = labels.join(", ");
            }
          }
          break;
        }
        case "queues": {
          {
            const labels = map(filter.value, "label");

            if (!labels.includes("All")) {
              remove(filter.value, (option: any) => option.value === 0);
              const queueIds = map(filter.value, "value");

              filters.queue_ids = queueIds.join(", ");
            }
          }
          break;
        }
        case "priority":
          {
            const labels = map(filter.value, "label");

            if (!labels.includes("All")) {
              remove(filter.value, (option: any) => option.value === 0);
              filters.priority = labels.join(", ");
            }
          }
          break;
        case "status":
          {
            const labels = map(filter.value, "label");

            if (!labels.includes("All")) {
              remove(filter.value, (option: any) => option.value === 0);
              filters.status = labels.join(", ");
            } else {
              filters.status = null;
            }
          }
          break;
        case "created_at": {
          const dates = filter?.value.filter((o: any) => o);
          if (size(dates) > 0) {
            const [start, end] = dates;

            const { startDate, endDate } = convertISTRangeToUTC(start, end);

            filters.start_date = startDate;
            filters.end_date = endDate;
          }
          break;
        }
        case "created_by_name":
          filters.search_created_by = filter?.value;
          break;

        default:
          break;
      }
    });

    const sortColumn = first(sorting);

    if (selectedQueueFilter.id === 0) {
      filters.my_queues = true;
    } else {
      filters.my_queues = false;
    }

    if (sortColumn) {
      filters.sort_field = sortColumn?.id;
      filters.sort_order = sortColumn?.desc ? "desc" : "asc";
    }

    const stringified = queryString.stringify(filters, {
      skipEmptyString: true,
      skipNull: true,
    });

    setSearchQueryString(stringified);
  }, [columnFilters, selectedQueueFilter, sorting, pagination]);

  //#endregion
  const removePage = () => {
    const updatedParams = new URLSearchParams(location.search); // Clone current parameters
    updatedParams.delete("page"); // Update the `index`
    setSearchParams(updatedParams); // Update the URL with the new parameters
  };

  useEffect(() => {
    if (debouncedSearchParams) {
      removePage();
      getQuestions(debouncedSearchParams);
      setIsLoaded(true);
    }
  }, [debouncedSearchParams]);

  useEffect(() => {
    if (debouncedSearchParams) {
      removePage();
      getQuestions(debouncedSearchParams, false);
      setIsLoaded(true);
    }
  }, [isRefresh]);

  const onClose = useCallback(() => {
    setShowReject(false);
    setIsRefresh((prev) => !prev);
  }, []);

  const updateQuestion = async (id: string, payload: any) => {
    try {
      await updateQuestions(id, payload);
      setIsRefresh((prev) => !prev);
    } catch (error) {
      console.error("updateQuestion error =>", error);
    }
  };

  //#region
  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor("question_text", {
        header: () => (
          <Table.Head
            label={translate("questions.columns.headers.question")}
            // icon={allImgPaths.question}
          />
        ),
        cell: ({ getValue, row }) => (
          <Table.Cell className="flex gap-x-1 justify-between items-center w-full">
            <div className="flex justify-between items-start w-full">
              <Tooltip
                place="top"
                content={
                  <div className="w-56">
                    <p>{getValue()}</p>
                  </div>
                }
              >
                <div className="flex justify-between">
                  <div className="w-full font-normal">
                    <p className="line-clamp-1">{getValue()}</p>
                  </div>
                </div>
              </Tooltip>
              <div
                className="flex justify-center items-center px-2 py-1 w-auto rounded-lg border duration-500 cursor-pointer shrink-0 hover:bg-tertiary-200 hover:border-tertiary-200"
                onClick={() => {
                  const query = {
                    q: "history",
                    conversationId: row.original.conversation_id,
                    questionId: row.original.id,
                    title:
                      toLower(row.original.status) !== "closed"
                        ? row.original.question_text
                        : "",
                    page: pagination.pageIndex + 1,
                    canReturn: true,
                  };

                  const queryParams = queryString.stringify(query, {
                    skipNull: true,
                    skipEmptyString: true,
                  });

                  navigate(
                    `/chats/${row.original.conversation_id}?${queryParams}`,
                  );
                }}
              >
                <span className="text-sm font-medium">
                  {translate("common.showChat")}
                </span>
              </div>
            </div>
          </Table.Cell>
        ),
        enableSorting: false,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("questions.columns.placeholders.question"),
        },
      }),
      columnHelper.accessor("queues", {
        header: () => (
          <Table.Head
            label={translate("questions.columns.headers.queues")}
            // icon={allImgPaths.globe}
          />
        ),
        cell: (info: any) => {
          const queueArray = map(info.getValue(), "queue_name");
          const queueNames = queueArray.join(", ");

          return (
            <Table.Cell>
              {size(queueArray) > 0 ? (
                <div className="flex flex-col items-start">
                  <div>
                    <span className="line-clamp-1">
                      {queueNames || EMPTY_CELL}
                    </span>
                  </div>
                  {size(queueArray) > 1 && (
                    <Tooltip
                      content={
                        <div className="p-3">
                          {/* <h3 className="text-base font-semibold">
                          {size(queueArray)} Queues Assigned
                        </h3> */}
                          <ul className="list-disc list-inside">
                            {queueArray.map((queue, index) => (
                              <li key={index}>{queue}</li>
                            ))}
                          </ul>
                        </div>
                      }
                      color="default"
                    >
                      <Chip
                        text={`${size(queueArray)} ${size(queueArray) > 1 ? translate("questions.columns.headers.queues") : translate("questions.columns.headers.queue")}`}
                        className="!rounded-[32px] mx-auto min-w-20"
                      />
                    </Tooltip>
                  )}
                </div>
              ) : (
                <div>{EMPTY_CELL}</div>
              )}
            </Table.Cell>
          );
        },
        enableColumnFilter: true,
        meta: {
          filterVariant: TABLE.FILTER.MULTISELECT,
          placeholder: translate("questions.columns.headers.queues"),
          data:
            currentEntityQueuesList.length > 0
              ? [{ value: 0, label: "All" }, ...currentEntityQueuesList]
              : [],
        },
      }),
      columnHelper.accessor("language", {
        header: () => (
          <Table.Head
            label={translate("questions.columns.headers.language")}
            // icon={allImgPaths.globe}
          />
        ),
        cell: ({ getValue, row: { original } }) => (
          <Table.Cell>
            <div className="flex flex-col gap-x-2">
              <p className="py-1 text-base font-medium sm:py-2 group-hover:hidden px-[16px]">
                {startCase(toLower(getValue())) ?? EMPTY_CELL}
              </p>
              <Dropdown
                className="hidden w-5 text-xs min-w-20 sm:text-sm group-hover:block !p-0"
                btnName="border-none"
                label={startCase(toLower(getValue()))}
                items={languagesList}
                onSelect={(item: any) => {
                  updateQuestion(original.id, { language: item.value });
                }}
                selectedItem={languagesList.find(
                  (o) => toLower(o.label) === toLower(original.language),
                )}
                dropDownIcon={allImgPaths.editLight}
              />
            </div>
          </Table.Cell>
        ),
        enableColumnFilter: true,
        meta: {
          filterVariant: TABLE.FILTER.MULTISELECT,
          placeholder: translate("questions.columns.placeholders.language"),
          data:
            languagesList.length > 0
              ? [{ label: "All", value: 0 }, ...languagesList]
              : [],
        },
      }),
      columnHelper.accessor("priority", {
        header: () => (
          <Table.Head
            label={translate("questions.columns.headers.priority")}
            // icon={allImgPaths.priority}
          />
        ),
        cell: ({ getValue, row: { original } }: any) => (
          <Table.Cell>
            <div className="flex flex-col pr-2">
              <div className="px-2 py-1 sm:py-2 group-hover:hidden">
                <Chip
                  text={startCase(toLower(getValue()))}
                  color={getValue()}
                  variant="contained"
                  className="!rounded-[32px] mx-auto min-w-20 !m-0"
                />
              </div>
              <div className="hidden group-hover:block">
                <Dropdown
                  className="text-xs sm:text-sm  !p-0"
                  btnName="border-none !pl-2"
                  label={
                    <Chip
                      text={startCase(toLower(getValue()))}
                      color={getValue()}
                      variant="contained"
                      className="!rounded-[32px] mx-auto min-w-20 hover:cursor-pointer"
                    />
                  }
                  items={PRIORITIES}
                  onSelect={(item: any) => {
                    updateQuestion(original.id, { priority: item.value });
                  }}
                  selectedItem={PRIORITIES.find(
                    (o) => toLower(o.label) === toLower(original.priority),
                  )}
                  dropDownIcon={allImgPaths.editLight}
                />
              </div>
              {/* <img
                src={allImgPaths.editLight}
                alt="edit icon"
                className="hidden w-5 group-hover:block"
              /> */}
            </div>
          </Table.Cell>
        ),
        enableColumnFilter: true,
        meta: {
          filterVariant: TABLE.FILTER.MULTISELECT,
          placeholder: translate("questions.columns.placeholders.priority"),
          data: [{ value: 0, label: "All" }, ...PRIORITIES],
        },
      }),
      columnHelper.accessor("status", {
        header: () => (
          <Table.Head
            label={translate("questions.columns.headers.status")}
            // icon={allImgPaths.priority}
          />
        ),
        cell: (info: any) => (
          <Table.Cell>
            <Chip
              text={startCase(toLower(info.getValue()))}
              color={upperCase(info.getValue()) as any}
              variant="contained"
              className="!rounded-[32px] mx-auto min-w-20 opacity-70"
            />
          </Table.Cell>
        ),
        enableColumnFilter: true,
        meta: {
          filterVariant: TABLE.FILTER.MULTISELECT,
          placeholder: translate("questions.columns.placeholders.status"),
          data: [{ value: 0, label: "All" }, ...QUESTION_STATUS],
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => (
          <Table.Head
            label={translate("questions.columns.headers.askedDate")}
            // icon={allImgPaths.calendarIcon}
          />
        ),
        cell: (info: any) => (
          <Table.Cell>{<RenderDate value={info.getValue()} />}</Table.Cell>
        ),
        meta: {
          filterVariant: TABLE.FILTER.DATE,
          placeholder: translate("questions.columns.placeholders.askedDate"),
        },
      }),
      columnHelper.accessor("created_by.name", {
        header: () => (
          <Table.Head
            label={translate("questions.columns.headers.askedBy")}
            // icon={allImgPaths.userIcon}
          />
        ),
        cell: ({ getValue, row: { original } }) => (
          <Table.Cell>
            <Tooltip content={get(original, "created_by.email", "")}>
              <p className="capitalize">{getValue() ?? EMPTY_CELL}</p>
              <p className="text-tertiary-400">
                {/* <span>({get(original, "created_by.username", "")})</span> */}
              </p>
            </Tooltip>
          </Table.Cell>
        ),
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("questions.columns.placeholders.askedBy"),
        },
      }),
      columnHelper.accessor((row) => row, {
        id: "Action",
        header: () => (
          <Table.Head>
            <Popover
              trigger={
                <img className="w-5 h-5" src={allImgPaths.describeIcon} />
              }
              content={<ActionGuide />}
              position="bottom"
            />
            <span className="text-base font-medium text-status-info">
              {translate("common.action")}
            </span>
          </Table.Head>
        ),
        cell: (info) => (
          <Table.Cell>
            {lowerCase(info.getValue().status) !== "closed" && (
              <div className="flex items-center gap-x-1.5">
                <Tooltip
                  title={translate("questions.columns.tooltips.answer")}
                  color="tertiary"
                >
                  <span
                    className="flex gap-x-1 justify-center items-center w-10 h-10 rounded-md duration-200 cursor-pointer hover:bg-status-success/20"
                    onClick={() => {
                      setSelectedQuestion(info.getValue());
                      navigate(
                        `/KEs?KEId=new&questionId=${info.getValue().id}&title=${info.getValue().question_text}&conversationId=${info.getValue().conversation_id}`,
                      );
                    }}
                  >
                    <img src={allImgPaths.actionAnswer} alt="" />
                  </span>
                </Tooltip>
                |
                <Tooltip
                  title={translate("questions.columns.tooltips.ignore")}
                  color="tertiary"
                >
                  <span
                    className="flex gap-x-1 justify-center items-center w-10 h-10 rounded-md duration-200 cursor-pointer hover:bg-status-error/20"
                    onClick={() => {
                      setSelectedQuestion(info.getValue());
                      setShowReject(true);
                    }}
                  >
                    <img src={allImgPaths.rejectCheckIcon} alt="" />
                  </span>
                </Tooltip>
                |
                <Tooltip
                  title={translate("questions.columns.tooltips.reRoute")}
                  color="tertiary"
                >
                  <span
                    className="flex gap-x-1 justify-center items-center w-10 h-10 rounded-md duration-200 cursor-pointer hover:bg-status-brand/20"
                    onClick={() => {
                      setSelectedQuestion(info.getValue());
                      setShowReroute(true);
                    }}
                  >
                    <img src={allImgPaths.rerouteCheckIcon} alt="" />
                  </span>
                </Tooltip>
              </div>
            )}
          </Table.Cell>
        ),
        enableSorting: false,
      }),
    ];
    return isLoading || !isLoaded
      ? columns.map((o: any) => {
          return {
            ...o,
            cell: () => <Loader count={1} className="!h-10" />,
          };
        })
      : columns;
  }, [
    pagination,
    isLoading,
    isLoaded,
    data,
    languagesList,
    currentEntityQueuesList,
    lang,
  ]);

  //#endregion

  const _data = React.useMemo(
    () => (isLoading || !isLoaded ? Array(LOADING_ROWS).fill({}) : data),
    [isLoading, data, isLoaded],
  );

  const table = useReactTable({
    data: _data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnPinning: {
        right: ["Action"],
      },
    },
    initialState: {},
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
  });

  const noRecords = size(columnFilters) <= 0 && size(_data) <= 0;

  return (
    <div className="w-full h-full">
      <PermissionGate
        action={ACTION.READ}
        page={PAGES.QUESTIONS}
        errorComponent={
          <UnauthorizedAccess
            header={translate("questions.restrictedMsg.heading")}
            message={translate("questions.restrictedMsg.message")}
          />
        }
      >
        {isLoading && !isLoaded ? (
          <LoaderCircle />
        ) : noRecords ? (
          <NoRecord heading={translate("questions.noRecordFound")} />
        ) : (
          <>
            <div className="flex justify-between mb-[15px]">
              <div className="flex gap-x-6 items-center">
                <Dropdown
                  className="w-full"
                  label={
                    <div className="flex gap-x-2 justify-between items-center">
                      <div className="flex gap-x-1">
                        <div>
                          <img src={allImgPaths.filters} />
                        </div>
                      </div>
                      <div className="flex">
                        <div className="flex justify-center p-1 text-center rounded-full min-w-28">
                          <span>
                            {selectedQueueFilter
                              ? translate(
                                  `questions.filter.${selectedQueueFilter?.key}` as any,
                                )
                              : QUESTIONS_FILTER[0].name}
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                  items={QUESTIONS_FILTER}
                  selectedItem={selectedQueueFilter}
                  onSelect={(val: any) => {
                    switch (val.id) {
                      case 0:
                        setColumnFilters((prev: ColumnFiltersState) => {
                          const queuesFilters: any = prev.find(
                            (o) => o.id === "queues",
                          );

                          if (size(queuesFilters) > 0) {
                            return [
                              ...prev.filter((o) => o.id !== "queues"),
                              { id: "queues", value: myQueues },
                            ];
                          } else {
                            return prev;
                          }
                        });

                        break;
                      case 1:
                        setColumnFilters((prev: ColumnFiltersState) => {
                          const queuesFilters: any = prev.find(
                            (o) => o.id === "queues",
                          );

                          if (size(queuesFilters) > 0) {
                            return [
                              ...prev.filter((o) => o.id !== "queues"),
                              {
                                id: "queues",
                                value: [
                                  { value: 0, label: "All" },
                                  ...currentEntityQueuesList,
                                ],
                              },
                            ];
                          } else {
                            return prev;
                          }
                        });
                        break;

                      default:
                        break;
                    }

                    setSelectedQueueFilter(val);
                  }}
                />
              </div>
            </div>
            <Table
              table={table}
              emptyRecordMsg={{
                heading: translate("common.noRecordMatch"),
                description: translate("questions.noRecordFoundDescription"),
              }}
              className="grid border-b grid-cols-[minmax(400px,90%)_minmax(250px,0%)_minmax(150px,0%)_minmax(150px,0%)_minmax(130px,0%)_minmax(210px,0%)_minmax(180px,0%)_minmax(190px,0%)]"
              bodyClassName="!h-[calc(100vh_-_370px)]"
              totalPages={totalPages}
              pagination={pagination}
              handlePageClick={(selected: number) => {
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: selected,
                }));
              }}
            />
          </>
        )}
      </PermissionGate>

      {/* Reject Question */}
      <RejectQuestionForm
        onClose={onClose}
        open={showReject}
        question={selectedQuestion}
      />

      {/* Reroute Question */}
      <Reroute
        onClose={() => {
          setShowReroute(false);
        }}
        onComplete={() => {
          setShowReroute(false);
          setIsRefresh((prev) => !prev);
        }}
        open={showReroute}
        question={selectedQuestion}
      />
    </div>
  );
};

export default Questions;
