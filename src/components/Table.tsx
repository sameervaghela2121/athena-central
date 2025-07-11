import allImgPaths from "@/assets/index";
import { Column, HeaderGroup, Row, flexRender } from "@tanstack/react-table";

import { TABLE } from "@/shared/constants";
import { compact, isEqual, size } from "lodash-es";
import moment from "moment";
import React, { memo, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import MultiLevelHoverDropdown from "./MultiLevelDropdown";
import MultiSelectDropdown from "./MultiSelectDropdown";
import Pagination from "./Pagination";
import SelectDropdown from "./SelectDropdown";

interface Props {
  table: any;
  className?: string;
  emptyRecordMsg?: { heading?: string; description?: string };
  isLoading?: boolean;
  bodyClassName?: string;
  totalPages: number;
  pagination: any;
  handlePageClick?: (page: number) => void;
}

const Filter = React.memo(({ column }: { column: Column<any, unknown> }) => {
  const columnFilterValue: any = column.getFilterValue();
  const [dateRange, setDateRange] = useState<any>([null, null]);
  const ref = useRef<DatePicker>(null);

  const {
    filterVariant,
    data,
    placeholder = "",
  }: any = column.columnDef.meta ?? {};

  useEffect(() => {
    switch (filterVariant) {
      case "date":
        setDateRange(columnFilterValue ?? []);
        break;

      default:
        break;
    }
  }, [columnFilterValue, filterVariant]);

  const onChangeDatePicker = (dates: any) => {
    setDateRange(dates);

    const cleanedDates = compact(dates);

    if (![1].includes(size(cleanedDates))) {
      column.setFilterValue(dates);
    }
  };

  switch (filterVariant) {
    case TABLE.FILTER.SELECT:
      return (
        <SelectDropdown
          dropdownContainerClasses="min-w-[150px]"
          options={data}
          value={columnFilterValue ?? { label: "All", value: 0 }}
          placeholder={placeholder}
          onSelect={(e) => {
            if (isEqual(columnFilterValue, e) || e.value === 0) {
              column.setFilterValue(undefined);
            } else {
              column.setFilterValue(e);
            }
          }}
        />
      );
    case TABLE.FILTER.MULTISELECT:
      return (
        <MultiSelectDropdown
          dropdownContainerClasses="min-w-[200px]"
          key={column.id}
          tooltip
          placeholder={placeholder}
          value={columnFilterValue ?? []}
          type="secondary"
          options={data}
          containerClasses="w-full px-2 pt-1.5"
          onSelect={(val) => {
            if (size(val)) {
              column.setFilterValue(val);
            } else {
              column.setFilterValue([]);
            }
          }}
        />
      );
    case TABLE.FILTER.TEXT:
      return (
        <div className="relative">
          <img
            src={allImgPaths.searchLight}
            className="absolute left-3 top-[59%] transform -translate-y-1/2 h-5 w-5"
          />
          <input
            className="border-none p-0 rounded-lg border border-tertiary-300 w-full outline-none pt-1.5 pl-10 pr-10"
            onChange={(event) => column.setFilterValue(event.target.value)}
            placeholder={placeholder ?? `Search...`}
            type="text"
            value={(columnFilterValue ?? "") as string}
          />

          {columnFilterValue && (
            <div
              className="absolute right-4 top-1/2 transform -translate-y-1/2 h-3 w-3 cursor-pointer mt-0.5"
              title="Clear"
              onClick={() => column.setFilterValue("")}
            >
              <img src={allImgPaths.closeIcon} />
            </div>
          )}
        </div>
      );
    case TABLE.FILTER.DATE: {
      const [start, end] = dateRange;

      const dateRangePicker = (
        value:
          | "today"
          | "yesterday"
          | "last7Days"
          | "last30Days"
          | "thisMonth"
          | "thisYear",
      ) => {
        let startDate, endDate;

        endDate = new Date(moment().endOf("day").toISOString());
        switch (value) {
          case "today": {
            startDate = new Date(moment().startOf("day").toISOString());
            break;
          }
          case "yesterday": {
            startDate = new Date(moment().add("day", -1).toISOString());
            endDate = new Date(
              moment().add("day", -1).endOf("day").toISOString(),
            );
            break;
          }
          case "last7Days": {
            startDate = new Date(moment().add("day", -7).toISOString());
            break;
          }
          case "thisMonth": {
            startDate = new Date(moment().startOf("month").toISOString());
            break;
          }
          case "last30Days": {
            startDate = new Date(moment().add("day", -30).toISOString());
            break;
          }
          case "thisYear": {
            startDate = new Date(moment().startOf("year").toISOString());
            break;
          }
        }

        onChangeDatePicker([startDate, endDate]);
        ref.current?.setOpen(false);
      };

      return (
        <div className="custom-datepicker">
          <DatePicker
            ref={ref}
            className="w-full text-sm flex gap-x-2.5 justify-between rounded-lg font-medium text-tertiary-800 focus:outline-none"
            onChange={onChangeDatePicker}
            placeholderText={placeholder ?? "Select date"}
            startDate={start ? start : null}
            endDate={end ? end : null}
            selectsRange
            isClearable
            showIcon
            showMonthDropdown
            showYearDropdown
            icon={<img src={allImgPaths.calendarDarkIcon} />}
            maxDate={new Date()}
            // monthsShown={2}
            // showPreviousMonths
            // inline
            renderCustomHeader={({
              date,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            }) => (
              <div className="flex flex-col items-center px-2 mb-2">
                <div className="flex justify-between items-center mb-4 w-full">
                  <button
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    className={`p-2 w-8 h-8 text-2xl rounded-full flex items-center justify-center hover:bg-secondary-300 ${
                      prevMonthButtonDisabled ? "opacity-50" : ""
                    }`}
                  >
                    <span>‹</span>
                  </button>
                  <span className="text-lg font-semibold">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "long",
                      year: "numeric",
                    }).format(date)}
                  </span>
                  <button
                    type="button"
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    className={`p-2 w-8 h-8 text-2xl rounded-full flex items-center justify-center hover:bg-secondary-300 ${
                      nextMonthButtonDisabled ? "opacity-50" : ""
                    }`}
                  >
                    <span>›</span>
                  </button>
                </div>
                <div className="flex flex-col gap-y-1 space-x-2">
                  <div className="flex gap-x-1 justify-center">
                    <button
                      className="px-2 py-1 text-white rounded bg-slate-500"
                      onClick={() => dateRangePicker("today")}
                    >
                      Today
                    </button>
                    <button
                      className="px-2 py-1 text-white rounded bg-slate-500"
                      onClick={() => dateRangePicker("yesterday")}
                    >
                      Yesterday
                    </button>
                    <button
                      className="px-2 py-1 text-white rounded bg-slate-500"
                      onClick={() => dateRangePicker("last7Days")}
                    >
                      Last 7 days
                    </button>
                  </div>
                  <div className="flex gap-x-1 justify-center">
                    <button
                      className="px-2 py-1 text-white rounded bg-slate-500"
                      onClick={() => dateRangePicker("thisMonth")}
                    >
                      This Month
                    </button>
                    <button
                      className="px-2 py-1 text-white rounded bg-slate-500"
                      onClick={() => dateRangePicker("last30Days")}
                    >
                      Last 30 Days
                    </button>
                    <button
                      className="px-2 py-1 text-white rounded bg-slate-500"
                      onClick={() => dateRangePicker("thisYear")}
                    >
                      This Year
                    </button>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      );
    }
    case TABLE.FILTER.MULTI_LEVEL_SELECT:
      return (
        <MultiLevelHoverDropdown
          items={data}
          key={column.id}
          onSelect={(val) => {
            if (size(val)) {
              column.setFilterValue(val);
            } else {
              column.setFilterValue([]);
            }
          }}
        />
      );

    default:
      return <></>;
  }
});

const Table: any = ({
  table,
  className = "",
  emptyRecordMsg = {
    heading: "No Match Found!",
    description:
      "Try adjusting the filters or clearing them to view all entries.",
  },
  isLoading = false,
  bodyClassName = "",
  totalPages = 0,
  pagination,
  handlePageClick = () => {},
}: Props) => {
  return (
    <>
      <div className={`overflow-x-auto min-w-full table-wrap`}>
        <div className="inline-block min-w-full">
          {/* Table Head */}

          {table.getHeaderGroups().map((headerGroup: HeaderGroup<any>) => (
            <div
              key={headerGroup.id}
              className={`border border-b-0 shadow-md border-tertiary-50 ${className}`}
            >
              {headerGroup.headers.map((header) => (
                <div
                  key={header.id}
                  className={`border-r select-none last:border-r-0 ${header.column.getIsFirstColumn("right") ? "sticky right-0 bg-white" : ""}`}
                >
                  {header.isPlaceholder ? null : (
                    <>
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "flex flex-col"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        <div className="flex justify-between p-2 bg-header">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getCanSort() && (
                            <div className="flex justify-center items-center cursor-pointer">
                              {typeof header.column.getNextSortingOrder() ===
                              "boolean" ? (
                                <img src={allImgPaths.sortingIcon} />
                              ) : header.column.getNextSortingOrder() ===
                                "asc" ? (
                                <img src={allImgPaths.priorityAsc} />
                              ) : (
                                <img src={allImgPaths.priorityDes} />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="">
                        {header.column.getCanFilter() && (
                          <Filter column={header.column} />
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Table Body */}
          <div
            className={`rounded-br-lg rounded-bl-lg border table-body border-tertiary-50 h-[calc(100vh_-_400px)] ${bodyClassName}`}
          >
            {table.getRowModel().rows.map((row: Row<any>) => (
              <div
                key={row.id}
                className={`border-b border-tertiary-50 ${className} hover:!bg-secondary-50/50`}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className={`hover:!bg-primary-50/50 group px-4 py-1.5 border-r flex items-center last:border-r-0 ${cell.column.getIsFirstColumn("right") ? "sticky right-0 bg-white hover:!bg-white" : ""}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            ))}

            {!isLoading && size(table.getRowModel().rows) <= 0 && (
              <div
                className="flex justify-center items-center my-5"
                style={{ height: "-webkit-fill-available" }}
              >
                <div className="flex flex-col gap-y-6 justify-center items-center p-10 text-center">
                  <div className="">
                    <img
                      src={allImgPaths.noRecord}
                      className="w-16 h-16 text-gray-400"
                    />
                  </div>
                  <div className="text-sm text-gray-500 select-none">
                    <h2 className="text-3xl font-bold">
                      {emptyRecordMsg.heading}
                    </h2>
                    <p>{emptyRecordMsg.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-end items-center mt-6">
          <Pagination
            pageCount={totalPages}
            currentPage={pagination.pageIndex}
            handlePageClick={({ selected }: { selected: number }) => {
              handlePageClick(selected);
            }}
          />
        </div>
      )}
    </>
  );
};

interface TableHeadProps extends HTMLDivElement {
  label?: string;
  icon?: string;
  children: any;
}
const Head: React.FC<TableHeadProps> = ({
  label,
  icon,
  children,
  className = "",
}) => {
  return (
    <div className={`flex gap-x-2 items-center ${className}`}>
      {children ? (
        children
      ) : (
        <>
          {icon && <img className="w-5 w-h" src={icon} />}
          <span className="text-base font-medium text-tertiary-900">
            {label}
          </span>
        </>
      )}
    </div>
  );
};

const Cell = ({
  children,
  className = "",
}: {
  children: any;
  className?: string;
}) => {
  return (
    <div
      className={`flex w-full font-medium break-all text-tertiary-900 ${className}`}
    >
      {children}
    </div>
  );
};

Table.Head = memo(Head);
Table.Cell = memo(Cell);

export default Table;
