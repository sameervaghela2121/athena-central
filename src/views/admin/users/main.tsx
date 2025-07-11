import { cloneDeep, first, map, remove, size } from "lodash-es";
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
import { toast } from "sonner";

import inviteApi from "@/apis/invite";
import allImgPaths from "@/assets/index";
import {
  ButtonV2,
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
import UnauthorizedAccess from "@/components/UnauthorizedAccess";
import useAppState, { RootState } from "@/context/useAppState";
import { useDebounce, useTranslate } from "@/hooks";
import usePermissions from "@/hooks/usePermissions";
import {
  ACTION,
  EMPTY_CELL,
  HOST,
  LOADING_ROWS,
  PAGES,
  ROLES,
  TABLE,
} from "@/shared/constants";
import { convertISTRangeToUTC, renameRoleLabel } from "@/shared/functions";
import { confirmAlert } from "react-confirm-alert";
import AssignGroupsModal from "./AssignGroupsModal";
import AssignRolesModal from "./AssignRolesModal";
import InviteFranchiseModal from "./InviteFranchiseModal";
import InviteUserModal from "./InviteUserModal";

type Columns = {
  name: string;
  email: string;
  roles: any[];
  groups: any[];
  status: string;
  is_active: boolean;
  last_login_at: string;
  job_title: string;
  facility: string;
  designation: string;
  location: string;
  region: string;
  action: string;
  queues: { name: string; id: string }[];
  id: string;
};

const columnHelper = createColumnHelper<Columns>();

const PAGE_SIZE = 10;
const DEFAULT_USER = {
  id: "",
  role: { id: "", name: "" },
  name: "",
  queues: [],
};

const Users = () => {
  const [searchQueryString, setSearchQueryString] = useState(""); // search queryString for filter/sorting etc
  const [assignRolesModal, setAssignRolesModal] = useState(false);
  const [assignGroupsModal, setAssignGroupsModal] = useState(false);
  const [inviteUserModal, setInviteUserModal] = useState(false);
  const [inviteFranchiseModal, setInviteFranchiseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "invited">("all");
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [isResending, setIsResending] = useState<{ [key: string]: boolean }>(
    {},
  );
  const { isAdmin } = useAppState(RootState.AUTH);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    role: {
      id: string;
      name: string;
    };
    name: string;
    queues: any[];
  }>(DEFAULT_USER);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isRefresh, setIsRefresh] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ]);
  const [roles, setRoles] = useState<any[]>([]);

  const { canDelete } = usePermissions(PAGES.USERS);
  const { translate } = useTranslate();

  const debouncedSearchParams = useDebounce(searchQueryString, 700);

  const { getUsers, data, total, isLoading, removeUser, isDeleting } =
    useAppState(RootState.USERS);
  const { getRoles } = useAppState(RootState.ROLES);
  const { lang } = useAppState(RootState.COMMON);
  const {
    user: { is_corporate_entity, role = "", id },
  } = useAppState(RootState.AUTH);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    (async () => {
      const stringified = queryString.stringify(
        {
          sort_field: "created_at",
          sort_order: "desc",
          is_filter_role_by_hierarchy: false,
        },
        {
          skipEmptyString: true,
          skipNull: true,
        },
      );
      const result = await getRoles(stringified);

      setRoles(result);
    })();
  }, []);

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

      sort_field: "created_at",
      sort_order: "desc",
      start_date: "",
      end_date: "",
      page_size: _pagination.pageSize,
      page: _pagination.pageIndex + 1,
      invited_only: activeTab === "invited",
    };

    columnFilters.forEach((filter: any) => {
      switch (filter.id) {
        case "roles":
          {
            const labels = map(filter.value, "label");

            if (!labels.includes("All")) {
              remove(filter.value, (option: any) => option.value === 0);
              const values = map(filter.value, "value");
              filters.roles = values;
            }
          }
          break;
        case "groups":
          {
            const labels = map(filter.value, "name");

            if (!labels.includes("All")) {
              remove(filter.value, (option: any) => option.value === 0);
              filters.groups = labels.join(", ");
            }
          }
          break;
        case "region":
          {
            const labels = map(filter.value, "name");

            if (!labels.includes("All")) {
              remove(filter.value, (option: any) => option.value === 0);
              filters.region = labels.join(", ");
            }
          }
          break;
        case "name":
          filters.name = filter?.value;
          break;
        case "email":
          filters.email = filter?.value;
          break;
        case "last_login_at":
          {
            const dates = filter?.value.filter((o: any) => o);
            if (size(dates) > 0) {
              const [start, end] = dates;
              const { startDate, endDate } = convertISTRangeToUTC(start, end);

              filters.start_date = startDate;
              filters.end_date = endDate;
            }
            break;
          }
          break;
        case "job_title":
          filters.job_title = filter?.value;
          break;
        case "facility":
          filters.facility = filter?.value;
          break;
        case "location":
          filters.location = filter?.value;
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
  }, [columnFilters, sorting, pagination, activeTab]);

  useEffect(() => {
    if (debouncedSearchParams) {
      getUsers(debouncedSearchParams);
      setIsLoaded(true);
    }
  }, [debouncedSearchParams]);

  useEffect(() => {
    if (debouncedSearchParams) {
      getUsers(debouncedSearchParams, false);
      setIsLoaded(true);
    }
  }, [isRefresh]);

  // Function to fetch invitations
  const fetchInvitations = async () => {
    try {
      setIsLoadingInvitations(true);
      const response = await inviteApi.getInvitations();
      if (response?.data?.data?.result) {
        const invitations = response.data.data.result;

        // Filter invitations by status (case insensitive)
        const pendingInvites = invitations.filter(
          (invite: any) => invite.status.toUpperCase() === "PENDING",
        );

        setPendingInvitations(pendingInvites);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  // Handle resend invitation
  const handleResendInvitation = async (invite: any) => {
    try {
      setIsResending((prev) => ({ ...prev, [invite.id]: true }));
      // Call the API to resend invitation
      await inviteApi.resendInvitation(invite.id);

      // Show success toast
      toast.success(`Invitation resent to ${invite.email} successfully`);
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error(`Failed to resend invitation to ${invite.email}`);
    } finally {
      setIsResending((prev) => ({ ...prev, [invite.id]: false }));
    }
  };

  // Fetch invitations when tab changes
  useEffect(() => {
    if (activeTab === "invited") {
      fetchInvitations();
    }
  }, [activeTab]);

  const handleClickDelete = async (id: string) => {
    try {
      const result = await removeUser(id);

      toast.success("User deleted successfully", { id: "delete-user" });

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

  const roleOptions = useMemo(() => {
    return roles.map((role) => {
      return { value: role.id, label: role.name };
    });
  }, [roles]);

  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor("name", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.userLight}
            label={translate("admin.user.columns.headers.name")}
          />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal">
            {info.getValue() ?? EMPTY_CELL}
          </Table.Cell>
        ),
        enableSorting: true,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("admin.user.columns.placeholders.name"),
        },
      }),
      columnHelper.accessor("email", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.email}
            label={translate("admin.user.columns.headers.email")}
          />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal line-clamp-1">
            {info.getValue() ?? EMPTY_CELL}
          </Table.Cell>
        ),
        enableColumnFilter: true,
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("admin.user.columns.placeholders.email"),
        },
      }),
      columnHelper.accessor("roles", {
        header: () => (
          <Table.Head
            // icon={allImgPaths.userLight}
            label={translate("admin.user.columns.placeholders.athenaRoles")}
          />
        ),
        cell: (info: any) => {
          const rolesNames = map(info.getValue(), "name");
          const totalRoles = size(rolesNames);

          return (
            <Table.Cell>
              {totalRoles > 0 ? (
                <div className="flex flex-col items-start">
                  <div>
                    <span className="line-clamp-1">
                      {renameRoleLabel(rolesNames.join(", ")) || EMPTY_CELL}
                    </span>
                  </div>
                  <Tooltip
                    content={
                      <div className="p-3">
                        <ul className="list-disc list-inside">
                          {rolesNames.map((name: string, index: number) => (
                            <li key={index}>{renameRoleLabel(name)}</li>
                          ))}
                        </ul>
                      </div>
                    }
                    color="default"
                  >
                    <div>
                      {/* <Chip
                        text={`${totalRoles} ${totalRoles > 1 ? "Roles" : "Role"}`}
                        className="!rounded-[32px] mx-auto min-w-20"
                      /> */}
                    </div>
                  </Tooltip>
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
          placeholder: translate("admin.user.columns.placeholders.athenaRoles"),
          data: [{ label: "All", value: 0 }, ...roleOptions],
        },
      }),
      columnHelper.accessor("last_login_at", {
        header: () => (
          <Table.Head
            label={translate("admin.user.columns.headers.lastLogin")}
          />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal">
            <RenderDate value={info.getValue()} />
          </Table.Cell>
        ),
        meta: {
          filterVariant: TABLE.FILTER.DATE,
          placeholder: translate("admin.user.columns.placeholders.lastLogin"),
        },
      }),
      columnHelper.accessor("designation", {
        header: () => (
          <Table.Head
            label={translate("admin.user.columns.headers.designation")}
          />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal">
            {info.getValue() ?? EMPTY_CELL}
          </Table.Cell>
        ),
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("admin.user.columns.placeholders.designation"),
        },
      }),
      columnHelper.accessor("region", {
        header: () => (
          <Table.Head label={translate("admin.user.columns.headers.region")} />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal">
            {info.getValue() ?? EMPTY_CELL}
          </Table.Cell>
        ),
        meta: {
          filterVariant: TABLE.FILTER.TEXT,
          placeholder: translate("admin.user.columns.placeholders.region"),
        },
      }),
      columnHelper.accessor("queues", {
        header: () => (
          <Table.Head label={translate("admin.user.columns.headers.queues")} />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal">
            {size(info.getValue()) > 0 && (
              <div className="w-full text-center">
                <Popover
                  position="top"
                  classes="!p-0"
                  content={
                    <div className="w-96">
                      <div className="p-4 text-base font-semibold">
                        Assigned Queues
                      </div>
                      <hr />
                      <div className="overflow-auto max-h-52">
                        <ul className="flex p-4 flex-col gap-y-1.5 list-disc list-inside">
                          {info.getValue()?.map((queue: any) => (
                            <Tooltip place="left" title={queue.name}>
                              <li key={queue.id} className="truncate">
                                {queue.name}
                              </li>
                            </Tooltip>
                          ))}
                        </ul>
                      </div>
                    </div>
                  }
                  trigger={<span>{size(info.getValue())}</span>}
                ></Popover>
              </div>
            )}
          </Table.Cell>
        ),
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
        cell: ({ getValue, row }) => {
          const userRole = first(map(row.original.roles, "name"));
          const userRoleId = first(map(row.original.roles, "id"));

          const canEditRole =
            role === ROLES.SUPER_ADMIN ||
            (role === ROLES.ADMIN && ![ROLES.SUPER_ADMIN].includes(userRole)) ||
            id === row.original.id;

          /* remove false for allow delete option */
          const canDeleteUser =
            false &&
            id !== row.original.id &&
            ![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(userRole);

          return (
            <div className="flex items-center gap-x-1.5 w-full justify-center">
              {canEditRole ? (
                <Popover
                  classes="!p-3 !rounded-lg"
                  trigger={
                    <span className="flex gap-x-1 justify-center items-center w-10 h-10 rounded-md duration-200 cursor-pointer select-none hover:bg-status-brand/20">
                      <img className="w-5 h-5" src={allImgPaths.more} />
                    </span>
                  }
                  content={
                    <div className="flex flex-col gap-y-1 !w-40">
                      <div
                        className="flex gap-x-1 items-center p-2 duration-300 cursor-pointer"
                        onClick={() => {
                          setAssignRolesModal(true);
                          setSelectedUser({
                            id: row.original.id,
                            role: {
                              id: userRoleId,
                              name: userRole,
                            },
                            name: row.original.name,
                            queues: row.original.queues,
                          });
                        }}
                      >
                        <img src={allImgPaths.roleIcon} alt="assignRole" />
                        <span>{translate("common.assignRole")}</span>
                      </div>
                      {canDeleteUser && (
                        <div
                          className="flex gap-x-1 items-center p-2 duration-300 cursor-pointer text-status-error"
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
                                              "admin.user.deleteConfirmMsg",
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
              ) : (
                <div className="min-h-10"></div>
              )}
            </div>
          );
        },
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
  }, [pagination, isLoading, isDeleting, isLoaded, data, lang, role]);

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
    initialState: {},
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
  });

  const invitedUserTable = useReactTable({
    data: pendingInvitations,
    columns: [
      {
        header: "Email",
        accessorKey: "email",
      },
      {
        header: "Role",
        accessorKey: "role.name",
        cell: ({ getValue }) => (
          <div className="flex flex-col items-start">
            <span className="line-clamp-1">
              {(getValue() || EMPTY_CELL)
                .toLowerCase()
                .replaceAll("_", " ")
                .replace(/\b\w/g, (c: any) => c.toUpperCase())}
            </span>
          </div>
        ),
      },
      {
        header: "Actions",
        accessorKey: "actions",
        cell: ({ row }) => (
          // <Tooltip content="Click to resend invitation" place="top">
          <ButtonV2
            onClick={() => handleResendInvitation(row.original)}
            className="!py-2 !px-4 text-xs !bg-none !border-none !shadow-none hover:!bg-none"
            variant="secondary"
            disabled={Boolean(isResending[row.original.id])}
          >
            Resend Invitation
          </ButtonV2>
          // </Tooltip>
        ),
      },
    ],
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  const noRecords = size(columnFilters) <= 0 && size(_data) <= 0;

  return (
    <div className="w-full h-full">
      <PermissionGate
        action={ACTION.READ}
        page={PAGES.USERS}
        errorComponent={
          <UnauthorizedAccess
            header={translate("questions.restrictedMsg.heading")}
            message={translate("questions.restrictedMsg.message")}
          />
        }
      >
        {/* Add Invite buttons at the top only for saas deployment */}
        {HOST.DEPLOYMENT_TYPE === "saas" && isAdmin() && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 items-center border-b">
              <div
                className={`px-4 py-2 cursor-pointer ${activeTab === "all" ? "border-b-2 border-status-brand text-status-brand font-medium" : "text-gray-500"}`}
                onClick={() => setActiveTab("all")}
              >
                Users
              </div>
              <div
                className={`px-4 py-2 cursor-pointer ${activeTab === "invited" ? "border-b-2 border-status-brand text-status-brand font-medium" : "text-gray-500"}`}
                onClick={() => setActiveTab("invited")}
              >
                Invited Users
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <ButtonV2
                onClick={() => setInviteUserModal(true)}
                rightIcon={allImgPaths.rightArrow}
              >
                Invite User
              </ButtonV2>
              {/* Only show Invite Franchise button for Super Admin */}
              {is_corporate_entity && (
                <ButtonV2
                  onClick={() => setInviteFranchiseModal(true)}
                  rightIcon={allImgPaths.rightArrow}
                >
                  Invite Franchise
                </ButtonV2>
              )}
            </div>
          </div>
        )}

        {activeTab === "all" ? (
          isLoading && !isLoaded ? (
            <LoaderCircle />
          ) : noRecords ? (
            <NoRecord heading={translate("admin.user.noRecordFound")} />
          ) : (
            <>
              <Table
                table={table}
                emptyRecordMsg={{
                  heading: translate("common.noRecordMatch"),
                  description: translate("admin.user.noRecordFoundDescription"),
                }}
                className="grid border-b grid-cols-[minmax(230px,30%)_minmax(420px,70%)_minmax(170px,0%)_minmax(210px,0%)_minmax(220px,0%)_minmax(180px,0%)_minmax(180px,0%)_minmax(80px,0%)]"
                // bodyClassName="!h-[calc(100vh_-_300px)]"
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
          )
        ) : (
          <div className="w-full">
            {isLoadingInvitations ? (
              <LoaderCircle />
            ) : pendingInvitations.length === 0 ? (
              <NoRecord heading="No pending invitations" />
            ) : (
              <Table
                table={invitedUserTable}
                emptyRecordMsg={{
                  heading: translate("common.noRecordMatch"),
                  description: translate("admin.user.noRecordFoundDescription"),
                }}
                className="grid border-b grid-cols-[minmax(420px,50%)_minmax(230px,35%)_minmax(170px,15%)]"
                // bodyClassName="!h-[calc(100vh_-_300px)]"
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
            )}
          </div>
        )}
      </PermissionGate>
      {/* Assign roles modal */}
      <AssignRolesModal
        user={selectedUser}
        show={assignRolesModal}
        onClose={() => {
          setAssignRolesModal(false);
          setSelectedUser(DEFAULT_USER);
          setIsRefresh((prev) => !prev);
        }}
      />

      {/* Assign groups modal */}
      <AssignGroupsModal
        userId={selectedUser.id}
        show={assignGroupsModal}
        onClose={() => {
          setAssignGroupsModal(false);
          setSelectedUser(DEFAULT_USER);
          setIsRefresh((prev) => !prev);
        }}
      />

      {/* Invite User Modal - only shown to admin or super admin */}
      {isAdmin() && (
        <InviteUserModal
          show={inviteUserModal}
          onClose={() => {
            setInviteUserModal(false);
            setIsRefresh((prev) => !prev);
          }}
        />
      )}

      {/* Invite Franchise Modal - only shown to admin or super admin */}
      {isAdmin() && (
        <InviteFranchiseModal
          show={inviteFranchiseModal}
          onClose={() => {
            setInviteFranchiseModal(false);
            setIsRefresh((prev) => !prev);
          }}
        />
      )}
    </div>
  );
};

export default Users;
