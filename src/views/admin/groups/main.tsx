import { cloneDeep, first, size } from "lodash-es";
import React, { useEffect, useMemo, useState } from "react";

import {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import queryString from "query-string";
import { confirmAlert } from "react-confirm-alert";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import allImgPaths from "@/assets/index";
import {
  ButtonV2,
  Drawer,
  Loader,
  LoaderCircle,
  Modal,
  NoRecord,
  PermissionGate,
  Popover,
  ReadMore,
  RenderDate,
  Table,
} from "@/components";
import UnauthorizedAccess from "@/components/UnauthorizedAccess";
import useAppState, { RootState } from "@/context/useAppState";
import { useDebounce, useTranslate } from "@/hooks";
import usePermissions from "@/hooks/usePermissions";
import {
  ACTION,
  EMPTY_CELL,
  LOADING_ROWS,
  PAGES,
  TABLE,
} from "@/shared/constants";
import { convertISTRangeToUTC } from "@/shared/functions";
import Create from "./Create";

type Columns = {
  created_at: string;
  name: string;
  action?: any;
  id: string;
  description: string;
  users_count: string;
  users: string;
  source: string;
};

const columnHelper = createColumnHelper<Columns>();

const PAGE_SIZE = 10;

const Groups = () => {
  const [searchQueryString, setSearchQueryString] = useState(""); // search queryString for filter/sorting etc
  const [createDrawer, setCreateDrawer] = useState(false); // create/edit group
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isRefresh, setIsRefresh] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "created_at",
      desc: true,
    },
  ]);

  const { translate } = useTranslate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  const debouncedSearchParams = useDebounce(searchQueryString, 700);

  const { data, total, getGroups, isLoading, isDeleting, removeGroup } =
    useAppState(RootState.GROUPS);
  const { canUpdate } = usePermissions(PAGES.GROUPS);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const queryParams = new URLSearchParams(location.search);
  const groupId = queryParams.get("groupId");

  useEffect(() => {
    if (groupId && canUpdate) {
      setCreateDrawer(true);
    } else {
      setSearchParams({});
    }
  }, [groupId, canUpdate]);

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
      description: null,
      members: null,
      source: null,
      sort_field: "created_at",
      sort_order: "desc",
      start_date: "",
      end_date: "",
      page_size: _pagination.pageSize,
      page: _pagination.pageIndex + 1,
    };

    columnFilters.forEach((filter: any) => {
      switch (filter.id) {
        case "name":
          filters.name = filter?.value;
          break;
        case "description":
          filters.description = filter?.value;
          break;
        case "members":
          filters.search_members = filter?.value;
          break;
        case "source":
          filters.search_source = filter?.value;
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
    if (debouncedSearchParams) {
      getGroups(debouncedSearchParams);
      setIsLoaded(true);
    }
  }, [debouncedSearchParams]);

  useEffect(() => {
    if (debouncedSearchParams) {
      getGroups(debouncedSearchParams, false);
      setIsLoaded(true);
    }
  }, [isRefresh]);

  const handleClickDelete = async (id: string) => {
    try {
      const result = await removeGroup(id);
      toast.success("group deleted successfully", { id: "delete-group" });

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

  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor("name", {
        header: () => (
          <Table.Head
            icon={allImgPaths.userLight}
            label={translate("admin.groups.columns.groupName")}
          />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal italic max-w-[82%]">
            <ReadMore text={info.getValue()} limit={50} />
          </Table.Cell>
        ),
        enableSorting: true,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: "Search",
        },
      }),
      columnHelper.accessor("description", {
        header: () => (
          <Table.Head
            icon={allImgPaths.describeIcon}
            label={translate("admin.groups.columns.description")}
          />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal italic max-w-[82%]">
            <ReadMore text={info.getValue() ?? EMPTY_CELL} limit={50} />
          </Table.Cell>
        ),
        enableColumnFilter: true,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: "Search",
        },
      }),
      columnHelper.accessor("users_count", {
        header: () => (
          <Table.Head
            icon={allImgPaths.userLight}
            label={translate("admin.groups.columns.members")}
          />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal justify-center max-w-[82%]">
            {info.getValue() ?? EMPTY_CELL}
          </Table.Cell>
        ),
        enableColumnFilter: true,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: "Search",
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => (
          <Table.Head
            icon={allImgPaths.calendarIcon}
            label={translate("admin.groups.columns.date")}
          />
        ),
        cell: (info: any) => <RenderDate value={info.getValue()} />,
        meta: {
          filterVariant: TABLE.FILTER.DATE,
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
        cell: (info) => (
          <div className="flex items-center gap-x-1.5 w-full justify-center">
            <Popover
              classes="!p-3 !rounded-lg"
              trigger={
                <span className="flex gap-x-1 justify-center items-center w-10 h-10 rounded-md duration-200 cursor-pointer select-none hover:bg-status-brand/20">
                  <img className="w-5 h-5" src={allImgPaths.more} />
                </span>
              }
              content={
                <div className="flex flex-col gap-y-1 w-24">
                  <div
                    className="flex gap-x-2 items-center p-2 duration-300 cursor-pointer"
                    onClick={() => {
                      setCreateDrawer(true);
                      setSearchParams({ groupId: info.getValue().id });
                    }}
                  >
                    <img src={allImgPaths.edit} alt="edit" />
                    <span>{translate("common.edit")}</span>
                  </div>
                  <div
                    className="flex gap-x-2 items-center p-2 duration-300 cursor-pointer text-status-error"
                    onClick={() => {
                      confirmAlert({
                        customUI: ({ onClose }) => {
                          return (
                            <Modal size="md" show={true} onClose={onClose}>
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
                                        "admin.groups.deleteConfirmMsg",
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
                                      onClick={async () => {
                                        await handleClickDelete(
                                          info.getValue().id,
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
                </div>
              }
              position="left"
            />
          </div>
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
  }, [pagination, isLoading, isDeleting, isLoaded, data]);

  const _data = React.useMemo(
    () => (isLoading || !isLoaded ? Array(LOADING_ROWS).fill({}) : data),
    [isLoading, data, isLoaded],
  );

  const table = useReactTable({
    data: _data,
    columns,
    filterFns: {},
    state: {
      sorting,
      columnFilters,
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
        page={PAGES.GROUPS}
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
          <NoRecord heading={translate("admin.groups.noRecordFound")} />
        ) : (
          <>
            <div className="flex justify-end mb-[15px]">
              <div className="flex gap-x-6 min-w-[193px]">
                <ButtonV2
                  className="rounded-[56px] bg-primary-900 text-white font-medium p-4 w-full flex items-center gap-x-1 justify-center text-base"
                  onClick={() => {
                    setCreateDrawer(true);
                  }}
                >
                  {translate("admin.groups.addNewGroupBtn")}
                </ButtonV2>
              </div>
            </div>

            <Table
              table={table}
              emptyRecordMsg={{
                heading: translate("common.noRecordMatch"),
                description: translate("admin.groups.noRecordFoundDescription"),
              }}
              className="grid border-b grid-cols-[minmax(250px,30%)_minmax(250px,40%)_minmax(150px,10%)_minmax(200px,10%)_minmax(80px,10%)]"
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
      </PermissionGate>

      {/* Create Groups */}
      <Drawer
        size="lg"
        show={createDrawer}
        onClose={() => {
          setCreateDrawer(false);
          setSearchParams({});
        }}
        icon={allImgPaths.rightIcon}
        title={
          groupId
            ? translate("admin.groups.form.update-group-title")
            : translate("admin.groups.form.new-group-title")
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

export default Groups;
