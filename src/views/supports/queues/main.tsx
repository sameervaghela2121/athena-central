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
  filter,
  first,
  get,
  lowerCase,
  map,
  orderBy,
  remove,
  size,
  startCase,
  toLower,
} from "lodash-es";
import queryString from "query-string";
import React, { useEffect, useMemo, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import allImgPaths from "@/assets/index";
import {
  ButtonV2,
  Chip,
  Drawer,
  Loader,
  LoaderCircle,
  Modal,
  NoRecord,
  PermissionGate,
  Popover,
  RenderDate,
  Table,
  Tooltip,
} from "@/components";
import Dropdown from "@/components/Dropdown";
import UnauthorizedAccess from "@/components/UnauthorizedAccess";
import useAppState, { RootState } from "@/context/useAppState";
import { useDebounce, useTranslate } from "@/hooks";
import usePermissions from "@/hooks/usePermissions";
import {
  ACTION,
  EMPTY_CELL,
  LOADING_ROWS,
  PAGES,
  QUEUES_FILTER_OPTIONS,
  TABLE,
} from "@/shared/constants";
import { convertISTRangeToUTC } from "@/shared/functions";
import Create from "./Create";

type Columns = {
  updated_at: string;
  priority: {
    id: number;
    name: string;
  };
  // languages: string;
  escalation_manager: string;
  name: string;
  created_by: string;
  asker: string;
  action?: any;
  id: string;
  assigned_users: string;
};

const columnHelper = createColumnHelper<Columns>();

const PAGE_SIZE = 10;

const Queues = () => {
  const { lang, languagesList } = useAppState(RootState.COMMON);

  const [searchQueryString, setSearchQueryString] = useState(""); // search queryString for filter/sorting etc
  const [createDrawer, setCreateDrawer] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    // {
    //   id: "languages",
    //   value: [{ value: 0, label: "All" }, ...languagesList],
    // },
    {
      id: "queue",
      value: "allQueues", // myQueues | allQueues
    },
  ]);

  const [isRefresh, setIsRefresh] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "updated_at",
      desc: true,
    },
  ]);
  const [selectedQueueFilter, setSelectedQueueFilter] = useState<any>(
    QUEUES_FILTER_OPTIONS[1],
  );

  const { translate } = useTranslate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  const debouncedSearchParams = useDebounce(searchQueryString, 700);

  const { getQueues, data, total, isLoading, removeQueues, isDeleting } =
    useAppState(RootState.QUEUES);
  const {
    user: { id: userId },
  } = useAppState(RootState.AUTH);

  const { canCreate, canDelete, canUpdate, canRead } = usePermissions(
    PAGES.QUEUES,
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const queryParams = new URLSearchParams(location.search);
  const queueId = queryParams.get("queueId");

  useEffect(() => {
    if (queueId) {
      setCreateDrawer(true);
    } else {
      setSearchParams({});
    }
  }, [queueId, canUpdate]);

  useEffect(() => {
    setPagination({
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    });
  }, [columnFilters]);

  useEffect(() => {
    const _pagination = cloneDeep(pagination);
    let filters: any = {
      name: null,
      assigned_users: null,
      escalation_manager: null,
      languages: null,
      created_by: null,
      sort_field: "updated_at",
      sort_order: "desc",
      start_date: "",
      end_date: "",
      page_size: _pagination.pageSize,
      page: _pagination.pageIndex + 1,
    };

    columnFilters.forEach((filter: any) => {
      switch (filter.id) {
        case "name":
          filters.search_name = filter?.value;
          break;
        case "queue":
          filters.my_queues = filter?.value === "myQueues";
          break;
        case "assigned_users":
          filters.search_assigned_user = filter?.value;
          break;
        case "escalation_manager":
          filters.search_escalation_manager = filter?.value;
          break;
        case "languages": {
          {
            const labels = map(filter.value, "label");

            if (!labels.includes("All")) {
              remove(filter.value, (option: any) => option.value === 0);
              filters.languages = labels.join(", ");
            }
          }
          break;
        }
        case "updated_at": {
          const dates = filter?.value.filter((o: any) => o);
          if (size(dates) > 0) {
            const [start, end] = dates;
            const { startDate, endDate } = convertISTRangeToUTC(start, end);

            filters.start_date = startDate;
            filters.end_date = endDate;
          }
          break;
        }
        case "created_by": {
          filters.search_created_by = filter?.value;
          break;
        }

        default:
          break;
      }
    });

    const sortColumn = first(sorting);

    if (sortColumn) {
      filters.sort_field = sortColumn?.id;
      filters.sort_order = sortColumn?.desc ? "desc" : "asc";
    }

    const stringified = queryString.stringify(filters, {
      skipEmptyString: true,
      skipNull: true,
    });

    setSearchQueryString(stringified);
  }, [columnFilters, sorting, pagination]);

  useEffect(() => {
    // if (!canRead) return;

    if (debouncedSearchParams) {
      getQueues(debouncedSearchParams);
      setIsLoaded(true);
    }
  }, [debouncedSearchParams, canRead]);

  useEffect(() => {
    if (debouncedSearchParams) {
      getQueues(debouncedSearchParams, false);
      setIsLoaded(true);
    }
  }, [isRefresh]);

  const handleClickDelete = async (id: string) => {
    try {
      const result = await removeQueues(id);

      toast.success("Queue deleted successfully", { id: "delete-queue" });

      if (size(data) === 1 && pagination.pageIndex !== 0) {
        setPagination((prev) => ({
          ...prev,
          pageIndex: prev.pageIndex - 1,
        }));
      } else {
        setIsRefresh((prev) => !prev);
      }

      return result;
    } catch (error) {
      console.error("handleClickDelete error =>", error);
    }
  };

  const generateLanguageArray = (
    data: string[],
    options: { label: string; value: string | number }[],
  ) => {
    const result = data.map((item) => {
      const option = options.find((option) => option.value === item);
      return option ? startCase(lowerCase(option.label)) : "Unknown";
    });

    return result;
  };

  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor("name", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.queuesLight}
            label={translate("queues.columns.headers.name")}
          />
        ),
        cell: ({ getValue, row }) => {
          const isSystemGenerated = get(
            row,
            "original.is_system_generated",
            false,
          );
          const assignedUsers = get(row, "original.assigned_users", []);
          const escalationManager = get(
            row,
            "original.escalation_manager",
            null,
          );

          const isOrphaned =
            assignedUsers.length === 0 || escalationManager === null;

          return (
            <Table.Cell className="flex flex-wrap gap-x-2 font-normal">
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

              {(isSystemGenerated || isOrphaned) && (
                <div className="flex gap-1">
                  {isSystemGenerated && (
                    <Chip
                      text="Default"
                      color="DRAFT"
                      className="!rounded-full"
                    />
                  )}
                  {isOrphaned && (
                    <Chip
                      text="Orphaned"
                      color="HIGH"
                      className="!rounded-full"
                    />
                  )}
                </div>
              )}
            </Table.Cell>
          );
        },
        enableSorting: true,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("queues.columns.placeholders.name"),
        },
      }),
      columnHelper.accessor("assigned_users", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.userLight}
            label={translate("queues.columns.headers.assignedUser")}
          />
        ),
        cell: (info: any) => {
          const users = orderBy(
            filter(info.getValue(), (o: any) => o?.name),
            [(o: any) => o.name],
            ["asc"],
          ) as { id: string; name: string }[];
          return (
            <div className="flex flex-wrap gap-2 text-base font-medium">
              {users.map((o: any) => (
                <span
                  className="px-2 rounded-md duration-500 text-tertiary-900 bg-tertiary-50 hover:bg-secondary-400"
                  key={o.id}
                >
                  <Tooltip
                    place="left"
                    content={
                      <div className="max-w-max">
                        <p>{o.name}</p>
                        <span className="text-sm text-tertiary-400">
                          {o.email}
                        </span>
                      </div>
                    }
                  >
                    <span className="duration-500">
                      {startCase(toLower(o.name))}
                    </span>
                  </Tooltip>
                </span>
              ))}
            </div>
          );
        },
        enableColumnFilter: true,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("queues.columns.placeholders.assignedUser"),
        },
      }),
      columnHelper.accessor("escalation_manager", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.userLight}
            label={translate("queues.columns.headers.escalationManager")}
          />
        ),
        cell: (info: any) => (
          <div className="flex justify-between w-full">
            <div className="text-base font-medium text-tertiary-400">
              <p className="text-base font-medium text-tertiary-900">
                {startCase(toLower(info.getValue()?.name)) || EMPTY_CELL}
              </p>
              {info.getValue()?.role_name && (
                <p className="text-base font-medium text-tertiary-400">
                  ({info.getValue().role_name})
                </p>
              )}
            </div>
          </div>
        ),
        enableColumnFilter: true,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate(
            "queues.columns.placeholders.escalationManager",
          ),
        },
      }),
      // columnHelper.accessor("languages", {
      //   header: () => (
      //     <Table.Head
      //       // icon={allImgPaths.globe}
      //       label={translate("queues.columns.headers.language")}
      //     />
      //   ),
      //   cell: (info: any) => (
      //     <div className="flex justify-between w-full">
      //       <div className="">
      //         <p className="text-base font-medium text-tertiary-900">
      //           {generateLanguageArray(info.getValue(), LANGUAGES).join(", ") ??
      //             EMPTY_CELL}
      //         </p>
      //       </div>
      //     </div>
      //   ),
      //   enableColumnFilter: true,
      //   meta: {
      //     filterVariant: TABLE.FILTER.MULTISELECT,
      //     placeholder: translate("queues.columns.placeholders.language"),
      //     data: [{ label: "All", value: 0 }, ...languagesList],
      //   },
      // }),
      columnHelper.accessor("updated_at", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.calendarIcon}
            label={translate("queues.columns.headers.date")}
          />
        ),
        cell: (info: any) => <>{<RenderDate value={info.getValue()} />}</>,
        meta: {
          filterVariant: TABLE.FILTER.DATE,
          placeholder: translate("queues.columns.placeholders.date"),
        },
      }),
      columnHelper.accessor("created_by", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.userLight}
            label={translate("queues.columns.headers.createdBy")}
          />
        ),
        cell: (info: any) => (
          <div className="flex justify-between w-full">
            <div className="text-base font-medium text-tertiary-400">
              <p className="text-base font-medium text-tertiary-900">
                {startCase(toLower(info.getValue()?.name)) || EMPTY_CELL}
              </p>
              {info.getValue()?.role_name && (
                <p className="text-base font-medium text-tertiary-400">
                  ({info.getValue().role_name})
                </p>
              )}
            </div>
          </div>
        ),
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("queues.columns.placeholders.createdBy"),
        },
      }),
      columnHelper.accessor((row) => row, {
        id: "Action",
        header: () => (
          <Table.Head className="justify-center w-full">
            <span className="text-base font-medium text-center text-status-info">
              {translate("common.action")}
            </span>
          </Table.Head>
        ),
        cell: ({ getValue, row }) => (
          <div className="flex items-center gap-x-1.5 w-full justify-center">
            {(canUpdate || canDelete) && (
              <Popover
                classes="!p-3 !rounded-lg"
                trigger={
                  <span className="flex gap-x-1 justify-center items-center w-10 h-10 rounded-md duration-200 cursor-pointer select-none hover:bg-status-brand/20">
                    <img className="w-5 h-5" src={allImgPaths.more} />
                  </span>
                }
                content={
                  <div className="flex flex-col gap-y-1 w-24">
                    {/* TODO : test created by after Queue API fixed */}
                    {(canUpdate ||
                      get(getValue(), "created_by.id", "") === userId) && (
                      <div
                        className="flex gap-x-2 items-center p-2 duration-300 cursor-pointer"
                        onClick={() => {
                          setCreateDrawer(true);
                          setSearchParams({ queueId: getValue().id });
                        }}
                      >
                        <img src={allImgPaths.edit} alt="edit" />
                        <span>{translate("common.edit")}</span>
                      </div>
                    )}
                    {!get(row, "original.is_system_generated", false) &&
                      (canDelete ||
                        get(getValue(), "created_by.id", "") === userId) && (
                        <div
                          className="flex gap-x-2 items-center p-2 duration-300 cursor-pointer text-status-error"
                          onClick={() => {
                            confirmAlert({
                              customUI: ({ onClose }) => {
                                return (
                                  <Modal
                                    size="md"
                                    show={true}
                                    onClose={onClose}
                                  >
                                    <div className="flex flex-col gap-y-10">
                                      <div>
                                        <div className="flex justify-center">
                                          <img
                                            src={allImgPaths.fileIcon}
                                            alt="file-icon"
                                          />
                                        </div>
                                        <div className="mt-4">
                                          <p className="text-base font-medium text-center capitalize">
                                            {translate(
                                              "queues.deleteConfirmMsg",
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-x-5 justify-center">
                                        <div>
                                          <ButtonV2
                                            onClick={onClose}
                                            variant="tertiaryDark"
                                          >
                                            {translate("common.cancel")}
                                          </ButtonV2>
                                        </div>
                                        <div>
                                          <ButtonV2
                                            loading={isDeleting}
                                            onClick={async () => {
                                              await handleClickDelete(
                                                getValue().id,
                                              );

                                              onClose();
                                            }}
                                            variant="error"
                                            rightIcon={allImgPaths.rightArrow}
                                          >
                                            {translate("common.delete")}
                                          </ButtonV2>
                                        </div>
                                      </div>
                                    </div>
                                  </Modal>
                                );
                              },
                            });
                          }}
                        >
                          <img src={allImgPaths.trash} alt="edit" />
                          <span>{translate("common.delete")}</span>
                        </div>
                      )}
                  </div>
                }
                position="left"
              />
            )}
          </div>
        ),
        enableSorting: false,
      }),
    ];

    // remove action column from table if edit and delete permission is not allowed
    if (!canDelete && !canUpdate) {
      columns.pop();
    }

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
    isDeleting,
    isLoaded,
    data,
    languagesList,
    canDelete,
    canUpdate,
    lang,
  ]);

  const _data = React.useMemo(
    () => (isLoading || !isLoaded ? Array(LOADING_ROWS).fill({}) : data),
    [isLoading, data, isLoaded],
  );

  const QUEUES_FILTER = useMemo(() => {
    return QUEUES_FILTER_OPTIONS.map((menu: any) => {
      return {
        ...menu,
        name: translate(`queues.filter.${menu.key}` as any),
      };
    });
  }, [QUEUES_FILTER_OPTIONS, lang]);

  const table = useReactTable({
    data: _data,
    columns,
    filterFns: {},
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

  const ActionButton = () => {
    return (
      <ButtonV2
        isVisible={canCreate}
        className="rounded-[56px] bg-primary-900 text-white font-medium p-4 w-full flex items-center gap-x-1 justify-center text-base"
        onClick={() => {
          setCreateDrawer(true);
        }}
      >
        {translate("queues.newQueueBtn")}
      </ButtonV2>
    );
  };

  const noRecords = size(columnFilters) <= 0 && size(_data) <= 0;

  let tableClass = `grid grid-cols-[minmax(300px,100%)_minmax(250px,0%)_minmax(210px,0%)_minmax(210px,0%)_minmax(200px,0%)_minmax(80px,0%)]`;
  if (!canDelete && !canUpdate) {
    tableClass = `grid grid-cols-[minmax(300px,100%)_minmax(250px,0%)_minmax(210px,0%)_minmax(210px,0%)_minmax(200px,0%)]`;
  }
  return (
    <div className="w-full h-full">
      <PermissionGate
        action={ACTION.READ}
        page={PAGES.QUEUES}
        errorComponent={
          <UnauthorizedAccess
            header={translate("queues.restrictedMsg.heading")}
            message={translate("queues.restrictedMsg.message")}
          />
        }
      >
        <>
          {isLoading && !isLoaded ? (
            <LoaderCircle />
          ) : noRecords ? (
            <NoRecord
              heading={translate("queues.noRecordFound")}
              action={<ActionButton />}
            />
          ) : (
            <>
              <div className="flex justify-between mb-[12px]">
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
                                    `queues.filter.${selectedQueueFilter?.key}` as any,
                                  )
                                : QUEUES_FILTER[0].name}
                            </span>
                          </div>
                        </div>
                      </div>
                    }
                    items={QUEUES_FILTER}
                    selectedItem={selectedQueueFilter}
                    onSelect={(val: any) => {
                      setColumnFilters((prev: ColumnFiltersState) => {
                        return [
                          ...prev.filter((o) => o.id !== "queue"),
                          { id: "queue", value: val.key },
                        ];
                      });

                      setSelectedQueueFilter(val);
                    }}
                  />
                </div>
                <div className="flex gap-x-6 min-w-[193px]">
                  <ActionButton />
                </div>
              </div>

              <Table
                table={table}
                emptyRecordMsg={{
                  heading: translate("common.noRecordMatch"),
                  description: translate("queues.noRecordFoundDescription"),
                }}
                className={`${tableClass}`}
                bodyClassName="!h-[calc(100vh_-_360px)]"
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
        </>
      </PermissionGate>

      {/* Create Queues */}
      <Drawer
        size="lg"
        show={createDrawer}
        onClose={() => {
          setCreateDrawer(false);
          setSearchParams({});
        }}
        icon={allImgPaths.rightIcon}
        title={
          queueId
            ? translate("queues.form.update-queue-title")
            : translate("queues.form.new-queue-title")
        }
      >
        {createDrawer && (
          <Create
            onClose={() => {
              setCreateDrawer(false);
              setSearchParams({});

              // check if page is not first then set to first page else refresh the record with same pagination
              if (pagination.pageIndex !== 0) {
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              } else {
                setIsRefresh((prev) => !prev);
              }
            }}
          />
        )}
      </Drawer>
    </div>
  );
};

export default Queues;
