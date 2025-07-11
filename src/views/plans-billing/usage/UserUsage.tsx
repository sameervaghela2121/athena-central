import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";

import {
  Chip,
  Loader,
  LoaderCircle,
  NoRecord,
  RenderDate,
  Table,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useDebounce, useTranslate } from "@/hooks";
import { capitalize, cloneDeep, first, size } from "lodash-es";
import queryString from "query-string";

type Columns = {
  usage: {
    message_count: number;
    remaining_message_count: number;
    usageLevel: string;
  };
  user_detail: {
    email: string;
    id: string;
    last_login_at: string;
    name: string;
  };
};

const PAGE_SIZE = 10;

const UserUsage = () => {
  const [searchQueryString, setSearchQueryString] = useState(""); // search queryString for filter/sorting etc
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "message_count",
      desc: false,
    },
  ]);

  const debouncedSearchParams = useDebounce(searchQueryString, 700);

  const { lang } = useAppState(RootState.COMMON);
  const {
    userWiseData,
    fetchUserWiseUsageList,
    isLoadingUserWiseData: isLoading,
    total,
    isLoaded,
  } = useAppState(RootState.PLAN_PRICING);
  const { translate } = useTranslate();

  useEffect(() => {
    if (debouncedSearchParams) {
      fetchUserWiseUsageList(debouncedSearchParams);
    }
  }, [debouncedSearchParams]);

  const columnHelper = createColumnHelper<Columns>();

  const countMessageUsageLevel: (
    message_count: number,
    remaining_message_count: number,
  ) => "LOW" | "MEDIUM" | "HIGH" = (
    message_count: number,
    remaining_message_count: number,
  ) => {
    if (remaining_message_count === 0) return "HIGH";

    if (!message_count || !remaining_message_count) return "LOW";
    // TODO: Implement message usage level logic
    // please find the % of uses and if % between 0-30 return "low" else if % between 30-70 return "medium" else return "high"
    // if message_count is greater than remaining_message_count return "high"

    const used = message_count - remaining_message_count;
    const percentage = (used / message_count) * 100;
    if (percentage < 30) return "LOW";
    if (percentage < 70) return "MEDIUM";
    return "HIGH";
  };

  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor("user_detail.name", {
        header: () => (
          <Table.Head label={translate("billing.usage.table.name")} />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal max-w-[82%] p-2">
            <span className="capitalize">{info.getValue()}</span>
          </Table.Cell>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("user_detail.email", {
        header: () => (
          <Table.Head label={translate("billing.usage.table.email")} />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal max-w-[82%] p-2">
            <span className="line-clamp-2">{info.getValue()}</span>
          </Table.Cell>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("usage.message_count", {
        header: () => (
          <Table.Head label={translate("billing.usage.table.messageUsed")} />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal max-w-[82%] p-2 justify-center">
            <span className="line-clamp-2">{info.getValue() || 0}</span>
          </Table.Cell>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("usage.usageLevel", {
        header: () => (
          <Table.Head label={translate("billing.usage.table.usageLevel")} />
        ),
        cell: ({ row }) => (
          <Table.Cell className="font-normal max-w-[82%] p-2 justify-center">
            <Chip
              variant="contained"
              text={capitalize(
                countMessageUsageLevel(
                  row?.original?.usage?.message_count,
                  row?.original?.usage?.remaining_message_count,
                ),
              )}
              color={countMessageUsageLevel(
                row?.original?.usage?.message_count,
                row?.original?.usage?.remaining_message_count,
              )}
            />
          </Table.Cell>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("user_detail.last_login_at", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.region}
            label={translate("billing.usage.table.lastLogin")}
          />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal">
            <RenderDate value={info.getValue()} />
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
  }, [pagination, isLoading, userWiseData, lang]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    const _pagination = cloneDeep(pagination);
    let filters: any = {
      page_size: _pagination.pageSize,
      page: _pagination.pageIndex + 1,
      sort_field: "message_count",
      sort_order: "desc",
    };

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
  }, [sorting, pagination]);

  const table = useReactTable({
    data: userWiseData,
    columns,
    filterFns: {},
    state: {
      sorting,
      // columnFilters,
    },
    initialState: {},
    // onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
  });

  const noRecords = size(userWiseData) <= 0;

  return (
    <div>
      {isLoading || !isLoaded ? (
        <div className="mt-10">
          <LoaderCircle />
        </div>
      ) : noRecords ? (
        <NoRecord heading={translate("billing.usage.noRecordFound")} />
      ) : (
        <>
          <Table
            table={table}
            emptyRecordMsg={{
              heading: translate("common.noRecordMatch"),
              description: translate("billing.usage.noRecordFoundDescription"),
            }}
            className="grid border-b grid-cols-[minmax(220px,0%)_minmax(300px,80%)_minmax(150px,0%)_minmax(150px,0%)_minmax(180px,0%)]"
            bodyClassName="!h-auto"
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
    </div>
  );
};

export default UserUsage;
