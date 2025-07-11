import { default as api } from "@/apis/KE";
import useAppState, { RootState } from "@/context/useAppState";
import {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import {
  cloneDeep,
  first,
  has,
  isEqual,
  map,
  remove,
  size,
  startCase,
  toLower,
} from "lodash-es";
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * AnimatedCounter component that displays a number with rolling pin animation effect
 * @param {object} props - Component props
 * @param {number} props.value - The number value to animate
 */
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const prevValueRef = useRef<number>(value);
  const [displayValue, setDisplayValue] = useState<number>(value);

  useEffect(() => {
    // Only animate when the value changes
    if (!isEqual(prevValueRef.current, value)) {
      prevValueRef.current = value;
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <span className="inline-flex overflow-hidden">
      {displayValue
        .toString()
        .split("")
        .map((digit, index) => (
          <div
            key={`${index}-container`}
            className="relative overflow-hidden h-[1.2em] w-[0.65em]"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${index}-${digit}-${value}`}
                className="flex absolute inset-0 justify-center items-center font-bold"
                initial={{
                  y: prevValueRef.current > value ? -30 : 30,
                  rotateX: prevValueRef.current > value ? 45 : -45,
                  opacity: 0,
                }}
                animate={{
                  y: 0,
                  rotateX: 0,
                  opacity: 1,
                }}
                exit={{
                  y: prevValueRef.current > value ? 30 : -30,
                  rotateX: prevValueRef.current > value ? -45 : 45,
                  opacity: 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 0.8,
                }}
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
    </span>
  );
};

import allImgPaths from "@/assets/index";
import {
  ButtonV2,
  Chip,
  Divider,
  Drawer,
  IconButton,
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
import CreateKE from "@/components/KEs/CreateKE";
import UnauthorizedAccess from "@/components/UnauthorizedAccess";
import { useDebounce, useTranslate } from "@/hooks";
import usePermissions from "@/hooks/usePermissions";
import {
  ACCESS_ROLE,
  ACTION,
  EMPTY_CELL,
  LOADING_ROWS,
  PAGES,
  ROLES,
  SAVE_MODE,
  TABLE,
} from "@/shared/constants";
import { convertISTRangeToUTC } from "@/shared/functions";
import DocumentViewer from "@/views/chats/components/DocumentViewer";
import queryString from "query-string";
import { confirmAlert } from "react-confirm-alert";
import { get } from "react-hook-form";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import AppTour from "./components/AppTour";
import BulkUploader from "./components/BulkUploader";
import ShareKEAccess from "./components/ShareKEAccess";

const KEsStatusBar: React.FC<{
  data: {
    DRAFT: number;
    PUBLISHED: number;
    FAILED: number;
    PENDING: number;
    PROCESSING: number;
    PROCESSED: number;
    total: number;
  };
}> = ({ data }) => {
  const processed = data.PROCESSED || 0;
  const processing = data.PROCESSING || 0;
  const pending = data.PENDING || 0;
  const total = processing + processed;

  const isCompleted = processing <= 0 && pending <= 0;
  const percentage = isCompleted ? 100 : (processed / total) * 100;

  return (
    <div className="flex items-center px-2 w-full sm:px-0">
      {total > 0 && (
        <div className="px-4 py-2 mx-auto w-full max-w-xs bg-white rounded-md border">
          <div className="flex gap-x-2 justify-between items-center mb-2">
            <span className="text-sm font-medium text-tertiary-900">
              Processing KEs:
            </span>
            <div
              className={`flex gap-x-1 items-center text-sm font-bold text-tertiary-700`}
            >
              <AnimatedCounter value={processed} /> of{" "}
              <AnimatedCounter value={total} /> completed
            </div>
          </div>

          <div className="w-full bg-tertiary-50 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className={`h-2.5 rounded-full bg-gradient-to-r from-secondary-600 via-secondary-700 to-secondary-900`}
              initial={{ width: 0 }}
              animate={{
                width: `${percentage}%`,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

type TableDataType = {
  content: string;
  documents: any[];
  documents_count: number;
  id: string;
  is_deleted: boolean;
  language: string;
  lock: any;
  published_at: any;
  published_by: any;
  status: string;
  title: string;
  created_by: string;
  created_at: string;
  deleted_at: any;
  deleted_by: any;
  updated_by: any;
  updated_at: string;
};

const columnHelper = createColumnHelper<TableDataType>();

const PAGE_SIZE = 10;

const KEs = () => {
  const { showBulkGuide, showKEGuide, lang, languagesList } = useAppState(
    RootState.COMMON,
  );
  const {
    data = [],
    getKEs,
    isLoading,
    total,
    removeKE,
    isDeleting,
    setDocumentList,
    toggleLockKE,
  } = useAppState(RootState.KE);
  const {
    user: { id: userId, role = "" },
  } = useAppState(RootState.AUTH);

  const [searchQueryString, setSearchQueryString] = useState(""); // search queryString for filter/sorting etc
  const [showDocument, setShowDocument] = useState(false);
  const [type, setType] = useState<"KE" | "BULK-UPLOAD">("KE");
  const [openTour, setOpenTour] = useState(false);
  const [bulkUploadDrawer, setBulkUploadDrawer] = useState(false); // Bulk Uploader
  const [newKEDrawer, setNewKEDrawer] = useState(false); // Single KE
  const [KEData, setKEData] = useState<any>(null);
  const [showAccessControlWarning, setShowAccessControlWarning] =
    useState<boolean>(false);
  const [submittingNewKE, setSubmittingNewKE] = useState<boolean>(false);
  const [accessKE, setAccessKE] = useState<{
    msg: string;
    icon?: string;
  } | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "language",
      value: [{ value: 0, label: "All" }, ...languagesList],
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
  const [openAccessControl, setOpenAccessControl] = useState(false);
  // Ref to track if an API call is in progress - more reliable than state for this purpose
  const isApiCallInProgressRef = useRef<boolean>(false);
  // Ref to track the previous processed value to avoid unnecessary refreshes
  const previousProcessedRef = useRef<number | null>(null);
  // Ref to store the interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [, setSearchParams] = useSearchParams();
  const { translate } = useTranslate();
  const location = useLocation();

  const [jobStatus, setJobStatusData] = useState<{
    DRAFT: number;
    PUBLISHED: number;
    FAILED: number;
    PENDING: number;
    PROCESSED: number;
    PROCESSING: number;
    total: number;
  }>({
    DRAFT: 0,
    PUBLISHED: 0,
    FAILED: 0,
    PENDING: 0,
    PROCESSING: 0,
    PROCESSED: 0,
    total: 0,
  });

  const { canCreate, canDelete, canUpdate } = usePermissions(
    PAGES.KNOWLEDGE_ENTRIES,
  );

  const debouncedSearchParams = useDebounce(searchQueryString, 700);

  const queryParams = new URLSearchParams(location.search);
  const KEId = queryParams.get("KEId");
  const viewer = queryParams.get("viewer");
  const drawerType = queryParams.get("type") || "";
  const force = queryParams.get("force") || "false";

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    // Start the job status interval on component mount
    startJobStatusInterval();

    // Clean up the interval on component unmount
    return () => {
      stopJobStatusInterval();
    };
  }, []); // Run only once on mount

  useEffect(() => {
    // force refresh the page
    if (force === "true") {
      setIsRefresh((prev) => !prev);
      setSearchParams({});
    }
  }, [force]);

  /**
   * Starts job status polling interval, clearing any existing interval first
   * Runs every 10 seconds and stops when total and processed match or on component unmount
   */
  const startJobStatusInterval = () => {
    // Stop any existing interval first
    stopJobStatusInterval();

    // Make initial call to get job status
    getJobStatus();

    // Create new interval that runs every 10 seconds
    const interval = setInterval(() => {
      // Only make the API call if no other call is in progress
      if (!isApiCallInProgressRef.current) {
        getJobStatus((completed = false) => {
          // If processing is complete (total === processed), clear the interval
          if (completed) {
            stopJobStatusInterval();
            setIsRefresh((prev) => !prev);
          }
        });
      }
    }, 10000); // 10 seconds interval as per requirement

    // Store reference to interval for cleanup
    intervalRef.current = interval;
  };

  /**
   * Stops the job status polling interval and cleans up resources
   */
  const stopJobStatusInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Removed duplicate useEffect that was also starting the job status interval

  useEffect(() => {
    // user select bulk from modal need to open bulk drawer
    if (drawerType === "bulk") {
      setNewKEDrawer(false);
      setBulkUploadDrawer(true);
    }
  }, [drawerType]);

  useEffect(() => {
    if (KEId && !viewer) {
      setNewKEDrawer(true);
    } else {
      setNewKEDrawer(false);
    }
  }, [KEId, viewer]);

  useEffect(() => {
    if (KEId && viewer) {
      setShowDocument(true);
    } else {
      setShowDocument(false);
    }
  }, [KEId, viewer]);

  useEffect(() => {
    setPagination({
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    });
  }, [columnFilters]);

  useEffect(() => {
    const _pagination = cloneDeep(pagination);

    let filters: any = {
      search_title: null,
      language: null,
      status: null,
      start_date: null,
      end_date: null,
      search_created_by: null,
      documents: null,
      sort_field: "updated_at",
      sort_order: "desc",
      page_size: _pagination.pageSize,
      page: _pagination.pageIndex + 1,
    };

    columnFilters.forEach((filter: any) => {
      switch (filter.id) {
        case "title":
          filters.search_title = filter?.value;
          break;
        case "language": {
          {
            const labels = map(filter.value, "label");

            if (!labels.includes("All")) {
              remove(filter.value, (option: any) => option.value === 0);
              filters.language = labels.join(", ");
            }
          }
          break;
        }
        case "status":
          filters.status = filter?.value.label;
          break;
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
    if (debouncedSearchParams) {
      getKEs(debouncedSearchParams);
      setIsLoaded(true);
    }
  }, [debouncedSearchParams]);

  useEffect(() => {
    if (debouncedSearchParams) {
      getKEs(debouncedSearchParams, false);
      setIsLoaded(true);
    }
    // clearInterval(currentInterval ?? undefined);
    // startJobStatusInterval();
    // isLoaded && startJobStatusInterval();
  }, [isRefresh]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r") {
        event.preventDefault();
        setIsRefresh((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const handleClickDelete = async (id: string) => {
    try {
      const result = await removeKE(id);

      toast.success("Knowledge Entries deleted successfully");

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

  const ActionButton = () => {
    return (
      <div className="flex gap-x-6 items-center">
        <IconButton
          isVisible={process.env.NODE_ENV === "development"}
          onClick={() => setIsRefresh((prev) => !prev)}
          src={allImgPaths.refresh}
          className={`flex justify-center items-center w-10 h-10`}
        />
        <ButtonV2
          isVisible={canCreate}
          variant="primary"
          onClick={() => {
            setType("KE");
            if (showKEGuide) {
              setOpenTour(true);
            } else {
              setNewKEDrawer(true);
            }
          }}
        >
          {translate("KEs.newKEBtn")}
        </ButtonV2>
        <ButtonV2
          isVisible={canCreate}
          variant="secondary"
          onClick={() => {
            setType("BULK-UPLOAD");
            if (showBulkGuide) {
              setOpenTour(true);
            } else {
              setBulkUploadDrawer(true);
            }
            setSubmittingNewKE(true);
          }}
        >
          {translate("KEs.newBulkKEBtn")}
        </ButtonV2>
      </div>
    );
  };

  /**
   * Fetches job status from API and updates state
   * Sets a flag to prevent concurrent API calls
   * @param onCompleted Callback function that receives completion status
   */
  const getJobStatus = async (onCompleted = (completed: boolean) => {}) => {
    // If an API call is already in progress, skip this call
    if (isApiCallInProgressRef.current) {
      return;
    }

    try {
      // Set flag to indicate API call is in progress
      isApiCallInProgressRef.current = true;

      const data = await api.fetchKEsProcessingStatus();

      setJobStatusData((prev) => {
        return {
          ...prev,
          ...data,
        };
      });

      // Check if processed value has changed from previous call
      const hasProcessedChanged =
        previousProcessedRef.current !== data.PROCESSING;

      // Update the previous processed value ref
      previousProcessedRef.current = data.PROCESSING;

      if (has(data, "PENDING") || has(data, "PROCESSING")) {
        if (hasProcessedChanged) {
          setIsRefresh((prev) => !prev);
        }
      } else {
        setJobStatusData({
          DRAFT: 0,
          PUBLISHED: 0,
          FAILED: 0,
          PENDING: 0,
          PROCESSING: 0,
          PROCESSED: 0,
          total: 0,
        });
        onCompleted(true);
      }
    } catch (error) {
      console.error("getJobStatus Error:", error);
    } finally {
      // Reset flag to indicate API call is complete
      isApiCallInProgressRef.current = false;
    }
  };

  const checkKELockStatus = async (KEId: string, callback: () => void) => {
    try {
      const { data } = await api.getKEById(KEId);
      const { result, message } = data.data;

      const locked_by = get(result, "lock.locked_by", null);
      const status = get(result, "status", "");
      const KEAccessRole = get(result, "access_role", ACCESS_ROLE.VIEWER);

      // if status is processing raise error
      if (status === SAVE_MODE.PROCESSING) {
        throw new Error("KE is currently being processed");
      }

      if (
        KEAccessRole !== ACCESS_ROLE.VIEWER &&
        locked_by &&
        locked_by !== userId &&
        ![SAVE_MODE.DRAFT, SAVE_MODE.PROCESSING].includes(status)
      ) {
        setAccessKE({ msg: message });
      } else {
        callback();
      }
    } catch (error) {
      const err = get(
        error,
        "response.data.errors.error",
        "something went wrong, please try again later",
      );

      toast.error(err);
    }
  };

  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor("title", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.KELight}
            label={translate("KEs.columns.headers.title")}
          />
        ),
        cell: ({
          getValue,
          row: {
            original: { id },
          },
        }) => (
          <Table.Cell className="w-full">
            <Tooltip
              place="top"
              content={
                <div className="w-full">
                  <p>{getValue()}</p>
                </div>
              }
            >
              <div className="flex gap-x-1 justify-between items-center w-full">
                <div className="flex gap-x-1 items-center font-normal text-tertiary-900">
                  <button
                    className="flex gap-x-2 items-center group"
                    onClick={() =>
                      setSearchParams({ KEId: id, viewer: "true" })
                    }
                  >
                    <span className="w-full font-normal text-left line-clamp-1 group-hover:underline">
                      {getValue()}
                    </span>
                    <img
                      src={allImgPaths.eyeIconBlack}
                      alt="View"
                      className="hidden duration-300 group-hover:flex"
                    />
                  </button>
                </div>
              </div>
            </Tooltip>
          </Table.Cell>
        ),
        enableSorting: true,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("KEs.columns.headers.title"),
        },
      }),
      columnHelper.accessor("language", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.globe}
            label={translate("KEs.columns.headers.language")}
          />
        ),
        cell: (info: any) => (
          <div className="flex justify-between w-full">
            <div className="">
              <p className="text-base font-medium">
                {startCase(toLower(info.getValue())) || EMPTY_CELL}
              </p>
            </div>
          </div>
        ),
        enableColumnFilter: true,
        meta: {
          filterVariant: TABLE.FILTER.MULTISELECT,
          placeholder: translate("KEs.columns.headers.language"),
          data: [{ label: "All", value: 0 }, ...languagesList],
        },
      }),
      columnHelper.accessor("status", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.status}
            label={translate("KEs.columns.headers.status")}
          />
        ),
        cell: ({ getValue, row: { original } }) => (
          <Chip
            text={startCase(toLower(getValue()))}
            color={getValue() as any}
            variant="contained"
            className="!rounded-[32px] mx-auto min-w-20"
          />
        ),
        enableColumnFilter: true,
        meta: {
          filterVariant: TABLE.FILTER.SELECT,
          placeholder: translate("KEs.columns.headers.status"),
          data: [
            { value: 0, label: "All" },
            { value: 1, label: "Draft" },
            { value: 2, label: "Processing" },
            { value: 3, label: "Published" },
          ],
        },
      }),
      columnHelper.accessor("updated_at", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.calendarIcon}
            label={translate("KEs.columns.headers.date")}
          />
        ),
        cell: (info: any) => <RenderDate value={info.getValue()} />,
        meta: {
          filterVariant: TABLE.FILTER.DATE,
          placeholder: translate("KEs.columns.headers.date"),
        },
      }),
      columnHelper.accessor("created_by", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.createdBy}
            label={translate("KEs.columns.headers.createdBy")}
          />
        ),
        cell: (info: any) => (
          <div className="flex justify-between w-full">
            <div className="text-base font-medium text-tertiary-400">
              <Tooltip title={info.getValue()?.email}>
                <p className="text-base text-tertiary-900">
                  {startCase(toLower(info.getValue()?.name)) || EMPTY_CELL}
                </p>
              </Tooltip>
            </div>
          </div>
        ),
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("KEs.columns.headers.createdBy"),
        },
      }),
      columnHelper.accessor("documents_count", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.documents}
            label={translate("KEs.columns.headers.documents")}
          />
        ),
        // meta: {
        //   filterVariant: TABLE.FILTER.MULTI_LEVEL_SELECT,
        //   data: CHAT_FILE_TYPES,
        //   placeholder: translate("KEs.columns.headers.documents"),
        // },
        cell: (info: any) => {
          const row = info.row.original;
          const failedDocuments =
            row.documents?.filter((doc: any) => doc.status === "FAILED") || [];

          return (
            <div className="flex relative gap-x-2 justify-center items-center w-full">
              <p className="text-base font-medium text-center">
                {info.getValue() || 0}
              </p>
              {failedDocuments.length > 0 && (
                <div className="flex absolute right-0 -top-1 items-center min-w-7">
                  <Popover
                    quick
                    position="top"
                    trigger={
                      <div className="p-2 rounded-full duration-500 cursor-pointer hover:bg-status-error/20">
                        <img
                          src={allImgPaths.warningRedIcon}
                          alt=""
                          className="w-5 h-5"
                        />
                      </div>
                    }
                    content={
                      <div className="max-w-lg text-base text-gray-700">
                        <div className="flex gap-x-2 items-center">
                          <img
                            src={allImgPaths.warningRedIcon}
                            alt=""
                            className="w-6 h-6"
                          />
                          <p className="mb-1 text-lg font-bold text-tertiary-900">
                            {translate("common.failedDocuments")}:
                          </p>
                        </div>
                        <Divider />
                        <ul className="pt-4 pl-4 list-disc">
                          {failedDocuments.map((doc: any, index: number) => (
                            <li key={index} className="mb-1">
                              <b className="font-bold text-tertiary-900">
                                {doc.file_name || doc.name}
                              </b>
                              : {doc.failure_reason || "Upload failed"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    }
                    classes="bg-white shadow-lg"
                  />
                </div>
              )}
            </div>
          );
        },
        enableSorting: false,
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
        cell: ({ getValue, row: { original } }) => (
          <div className="flex items-center gap-x-1.5 w-full justify-center">
            {(canUpdate || canDelete) && (
              <Popover
                classes="!p-3 !rounded-lg !ml-12"
                trigger={
                  <span className="flex gap-x-1 justify-center items-center w-10 h-10 rounded-md duration-200 cursor-pointer select-none hover:bg-status-brand/20">
                    <img className="w-6 h-6" src={allImgPaths.more} />
                  </span>
                }
                content={
                  <div className="flex flex-col gap-y-1 max-w-fit">
                    {/* when viewer access, just show view button else show edit and delete button as per permission access */}

                    <>
                      {[
                        ACCESS_ROLE.OWNER,
                        ACCESS_ROLE.EDITOR,
                        ACCESS_ROLE.VIEWER,
                      ].includes(
                        get(getValue(), "access_role", ACCESS_ROLE.VIEWER) ||
                          ACCESS_ROLE.VIEWER,
                      ) && (
                        <div
                          className="flex gap-x-2 items-center p-2 duration-300 cursor-pointer"
                          onClick={() => {
                            setSearchParams({
                              KEId: getValue().id,
                              viewer: `true`,
                            });
                          }}
                        >
                          <img
                            src={allImgPaths.eyeIconBlack}
                            alt="view"
                            className="w-6 h-6"
                          />
                          <span>{translate("common.view")}</span>
                        </div>
                      )}
                      {[ACCESS_ROLE.OWNER, ACCESS_ROLE.EDITOR].includes(
                        get(getValue(), "access_role", ""),
                      ) && (
                        <>
                          <div
                            className="flex gap-x-2 items-center p-2 duration-300 cursor-pointer"
                            onClick={(e) => {
                              original?.status === SAVE_MODE.PROCESSING
                                ? e.stopPropagation()
                                : checkKELockStatus(getValue().id, () => {
                                    setSearchParams({ KEId: getValue().id });
                                  });
                            }}
                          >
                            <Tooltip
                              className="w-full"
                              title={
                                original?.status === SAVE_MODE.PROCESSING
                                  ? translate("KEs.cannotEditWhileProcessing")
                                  : ""
                              }
                            >
                              <div
                                className={`flex gap-x-2 items-center ${
                                  original?.status === SAVE_MODE.PROCESSING
                                    ? "cursor-not-allowed opacity-50"
                                    : ""
                                }`}
                              >
                                <img
                                  src={allImgPaths.edit}
                                  alt="edit"
                                  className="w-6 h-6"
                                />
                                <span>{translate("common.edit")}</span>
                              </div>
                            </Tooltip>
                          </div>
                          {original.status === SAVE_MODE.PUBLISHED && (
                            <div
                              className="flex gap-x-2 items-center p-2 duration-300 cursor-pointer"
                              onClick={() => {
                                checkKELockStatus(getValue().id, () => {
                                  setOpenAccessControl(true);
                                  setKEData(original);
                                });
                              }}
                            >
                              <img
                                src={allImgPaths.lockLight}
                                alt="share access"
                                className="w-6 h-6"
                              />
                              <span>{translate("common.shareAccess")}</span>
                            </div>
                          )}
                        </>
                      )}

                      {([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role) ||
                        get(getValue(), "created_by.id", "") === userId) && (
                        <div
                          className="flex gap-x-2 items-center p-2 duration-300 cursor-pointer text-status-error"
                          onClick={() => {
                            checkKELockStatus(getValue().id, async () => {
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
                                            <p className="text-base font-medium text-center">
                                              {translate(
                                                "KEs.deleteConfirmMsg",
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
                                                checkKELockStatus(
                                                  getValue().id,
                                                  async () => {
                                                    await handleClickDelete(
                                                      getValue().id,
                                                    );
                                                    onClose();
                                                  },
                                                );
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
                            });
                          }}
                        >
                          <img
                            src={allImgPaths.trash}
                            alt="delete"
                            className="w-6 h-6"
                          />
                          <span>{translate("common.delete")}</span>
                        </div>
                      )}
                    </>
                  </div>
                }
                position="bottom"
              />
            )}
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
  }, [
    pagination,
    isLoading,
    isDeleting,
    isLoaded,
    canDelete,
    canUpdate,
    data,
    languagesList,
    lang,
  ]);

  const onCloseAccessModal = () => {
    setAccessKE(null);
  };

  // remove action column from table if edit and delete permission is not allowed
  if (!canDelete && !canUpdate) {
    columns.pop();
  }

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
      columnPinning: {
        right: ["Action"],
      },
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
  });

  const noRecords = size(columnFilters) <= 0 && size(_data) <= 0;

  let tableClass =
    "grid border-b grid-cols-[minmax(400px,100%)_minmax(130px,0%)_minmax(130px,0%)_minmax(210px,0%)_minmax(180px,0%)_minmax(120px,0%)_minmax(80px,0%)]";

  if (!canDelete) {
    tableClass =
      "grid border-b grid-cols-[minmax(400px,100%)_minmax(130px,0%)_minmax(130px,0%)_minmax(210px,0%)_minmax(180px,0%)_minmax(120px,0%)]";
  }

  return (
    <div className="w-full h-full">
      <PermissionGate
        action={ACTION.READ}
        page={PAGES.KNOWLEDGE_ENTRIES}
        errorComponent={
          <UnauthorizedAccess
            header={translate("KEs.restrictedMsg.heading")}
            message={translate("KEs.restrictedMsg.message")}
          />
        }
      >
        <>
          {isLoading && !isLoaded ? (
            <LoaderCircle />
          ) : noRecords ? (
            <NoRecord
              heading={translate("KEs.noRecordFound")}
              action={<ActionButton />}
            />
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between gap-y-4 md:gap-y-0 mb-[12px]">
                <div className="flex gap-x-2 items-center">
                  <KEsStatusBar data={jobStatus} />
                </div>
                <div className="flex justify-start md:justify-end">
                  <ActionButton />
                </div>
              </div>
              <Table
                table={table}
                emptyRecordMsg={{
                  heading: translate("common.noRecordMatch"),
                  description: translate("KEs.noRecordFoundDescription"),
                }}
                className={tableClass}
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

      {openTour && (
        <AppTour
          type={type}
          onClose={() => {
            setOpenTour(false);
          }}
          onDone={() => {
            switch (type) {
              case "KE":
                // open KE
                setNewKEDrawer(true);
                break;
              case "BULK-UPLOAD":
                setBulkUploadDrawer(true);
                break;

              default:
                break;
            }
          }}
          open={openTour}
        />
      )}

      {/* BULK UPLOAD*/}
      <Drawer
        size="lg"
        show={bulkUploadDrawer}
        onClose={() => {
          setBulkUploadDrawer(false);
          setDocumentList([]);
          setSearchParams({});
          setIsRefresh((prev) => !prev);

          if (KEId) {
            toggleLockKE(KEId, "unlock");
          }
        }}
        icon={allImgPaths.rightIcon}
        title={false}
      >
        {bulkUploadDrawer && (
          <BulkUploader
            onSave={(message) => {
              if (message) {
                toast.success(message);
              }
              setBulkUploadDrawer(false);
              setDocumentList([]);
              if (KEId) {
                toggleLockKE(KEId, "unlock");
              }
              setIsRefresh((prev) => !prev);
              startJobStatusInterval();
            }}
            onHelp={() => {
              setType("BULK-UPLOAD");
              setOpenTour(true);
            }}
            onClose={() => {
              setBulkUploadDrawer(false);
              setSearchParams({});
              stopJobStatusInterval();
            }}
            type={type}
            showAccessControlWarning={showAccessControlWarning}
            setShowAccessControlWarning={setShowAccessControlWarning}
            submittingNewKE={submittingNewKE}
            setSubmittingNewKE={setSubmittingNewKE}
          />
        )}
      </Drawer>

      {/* SINGLE Create KE */}
      <Drawer
        size="lg"
        show={newKEDrawer}
        onClose={() => {
          setNewKEDrawer(false);
          setSearchParams({});
          if (KEId && KEId !== "new") {
            toggleLockKE(KEId, "unlock");
          }
          stopJobStatusInterval();
        }}
        icon={allImgPaths.rightIcon}
        title={false}
      >
        {newKEDrawer && (
          <CreateKE
            show={newKEDrawer}
            onRestrictedAccess={(obj: any) => {
              setAccessKE(obj);
              setNewKEDrawer(false);
              setSearchParams({});
              stopJobStatusInterval();

              if (pagination.pageIndex !== 0) {
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              } else {
                setIsRefresh((prev) => !prev);
              }
            }}
            onSave={(message) => {
              stopJobStatusInterval();

              if (message) {
                toast.success(message);
              }

              if (KEId && KEId !== "new") {
                toggleLockKE(KEId, "unlock");
              }

              setNewKEDrawer(false);
              setSearchParams({});

              // check if page is not first then set to first page else refresh the record with same pagination
              if (pagination.pageIndex !== 0) {
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              } else {
                setIsRefresh((prev) => !prev);
              }
              startJobStatusInterval();
            }}
            onHelp={() => {
              setType("KE");
              setOpenTour(true);
            }}
            onClose={() => {
              setNewKEDrawer(false);
              setSearchParams({});
              stopJobStatusInterval();
              setSubmittingNewKE(false);
            }}
          />
        )}
      </Drawer>

      {showDocument && (
        <DocumentViewer
          show={showDocument}
          onClose={() => {
            setSearchParams({});
            setShowDocument(false);
          }}
        />
      )}

      <Modal
        backdrop={false}
        show={openAccessControl}
        size="2xl"
        extraClasses={"p-0"}
      >
        {openAccessControl && (
          <ShareKEAccess
            onClose={() => setOpenAccessControl(false)}
            KEId={KEData?.id}
          />
        )}
      </Modal>

      <Modal
        size="md"
        show={Boolean(accessKE)}
        onClose={onCloseAccessModal}
        extraClasses="py-16 px-4"
      >
        <div className="flex flex-col gap-y-10">
          <div>
            <div className="flex justify-center">
              <img
                src={accessKE?.icon ?? allImgPaths.accessIcon}
                alt="file-icon"
              />
            </div>
            <div className="mt-4">
              <p className="text-base font-medium text-center">
                {accessKE?.msg}
              </p>
            </div>
          </div>
          <div className="flex gap-x-5 justify-center">
            <div>
              <ButtonV2
                onClick={async () => {
                  onCloseAccessModal();
                }}
                variant="tertiary"
              >
                {translate("common.ok")}
              </ButtonV2>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KEs;
