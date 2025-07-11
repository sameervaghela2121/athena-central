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
import { useLocation, useSearchParams } from "react-router-dom";

import allImgPaths from "@/assets/index";
import {
  Drawer,
  Loader,
  LoaderCircle,
  NoRecord,
  PermissionGate,
  RenderDate,
  Table,
} from "@/components";
import UnauthorizedAccess from "@/components/UnauthorizedAccess";
import useAppState, { RootState } from "@/context/useAppState";
import { useDebounce, useTranslate } from "@/hooks";
import usePermissions from "@/hooks/usePermissions";
import { ACTION, LOADING_ROWS, PAGES, TABLE } from "@/shared/constants";
import { renameRoleLabel } from "@/shared/functions";
import Create from "./Create";

type Columns = {
  updated_at: string;
  name: string;
  is_active: boolean;
  action?: any;
  id: string;
  description: string;
  // permissions: string[];
};

const columnHelper = createColumnHelper<Columns>();

const PAGE_SIZE = 10;

const Roles = () => {
  const [searchQueryString, setSearchQueryString] = useState(""); // search queryString for filter/sorting etc
  const [createDrawer, setCreateDrawer] = useState(false); // open drawer for add/edit role
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isRefresh, setIsRefresh] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "updated_at",
      desc: false,
    },
  ]);

  const { translate } = useTranslate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  const debouncedSearchParams = useDebounce(searchQueryString, 700);

  const { data, total, getRoles, isLoading, isDeleting } = useAppState(
    RootState.ROLES,
  );
  const {
    user: { id: userId },
  } = useAppState(RootState.AUTH);
  const { lang } = useAppState(RootState.COMMON);

  const { canDelete, canRead, canUpdate } = usePermissions(PAGES.ROLES);

  const queryParams = new URLSearchParams(location.search);
  const roleId = queryParams.get("roleId");

  useEffect(() => {
    if (roleId && canUpdate) {
      setCreateDrawer(true);
    }
  }, [roleId, canUpdate]);

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
      sort_field: "updated_at",
      sort_order: "desc",
      page_size: _pagination.pageSize,
      is_filter_role_by_hierarchy: false,
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
      getRoles(debouncedSearchParams);
      setIsLoaded(true);
    }
  }, [debouncedSearchParams, canRead]);

  useEffect(() => {
    if (debouncedSearchParams) {
      getRoles(debouncedSearchParams, false);
      setIsLoaded(true);
    }
  }, [isRefresh]);

  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor("name", {
        header: () => (
          <Table.Head label={translate("admin.roles.columns.headers.name")} />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal max-w-[82%] p-2">
            <span className="capitalize">
              {renameRoleLabel(info.getValue())}
            </span>
          </Table.Cell>
        ),
        enableSorting: true,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("admin.roles.columns.placeholders.name"),
        },
      }),
      columnHelper.accessor("description", {
        header: () => (
          <Table.Head
            label={translate("admin.roles.columns.headers.description")}
          />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal max-w-[82%] p-2">
            <span className="line-clamp-2">{info.getValue()}</span>
          </Table.Cell>
        ),
        enableColumnFilter: true,
        enableSorting: false,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate(
            "admin.roles.columns.placeholders.description",
          ),
        },
      }),
      columnHelper.accessor("updated_at", {
        header: () => (
          <Table.Head label={translate("admin.roles.columns.headers.date")} />
        ),
        cell: (info: any) => <RenderDate value={info.getValue()} />,
        enableColumnFilter: false,
        meta: {
          filterVariant: TABLE.FILTER.DATE,
          placeholder: translate("admin.roles.columns.placeholders.date"),
        },
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
    isDeleting,
    isLoaded,
    userId,
    canDelete,
    canUpdate,
    data,
    lang,
  ]);

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
        page={PAGES.ROLES}
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
          <NoRecord heading={translate("admin.roles.noRecordFound")} />
        ) : (
          <>
            <Table
              table={table}
              emptyRecordMsg={{
                heading: translate("common.noRecordMatch"),
                description: translate("admin.roles.noRecordFoundDescription"),
              }}
              className="grid border-b grid-cols-[minmax(250px,10%)_minmax(300px,90%)_minmax(210px,0%)]"
              bodyClassName="!h-auto"
              // bodyClassName="!h-[calc(100vh_-_300px)]"
              totalPages={0}
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

      {/* Create Roles */}
      {/* NOT IN USE ANYMORE AS WE HAVE FIXED ROLE INTO SYSTEM NOW */}
      <Drawer
        size="lg"
        show={createDrawer}
        onClose={() => {
          setCreateDrawer(false);
          setSearchParams({});
        }}
        icon={allImgPaths.rightIcon}
        title={
          roleId
            ? translate("admin.roles.form.editHeading")
            : translate("admin.roles.form.newHeading")
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

export default Roles;
