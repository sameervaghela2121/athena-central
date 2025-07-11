import React, { useEffect, useMemo, useState } from "react";

import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useLocation, useSearchParams } from "react-router-dom";

import allImgPaths from "@/assets/index";
import {
  ButtonV2,
  Drawer,
  Loader,
  LoaderCircle,
  PermissionGate,
  ReadMore,
  Table,
  Tooltip,
} from "@/components";
import Switch from "@/components/Switch";
import UnauthorizedAccess from "@/components/UnauthorizedAccess";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { ACTION, LOADING_ROWS, PAGES } from "@/shared/constants";
import { countBy, get, replace, toUpper } from "lodash-es";
import { toast } from "sonner";
import Create from "./Create";

type Columns = {
  name: string;
  description: string;
  is_enabled: string;
  is_displayed_on_ke: string;
  id: string;
  attribute_type: "SYSTEM_ATTRIBUTE" | "CUSTOM_ATTRIBUTE";
};

const columnHelper = createColumnHelper<Columns>();

const PAGE_SIZE = 10;

const Roles = () => {
  const [createDrawer, setCreateDrawer] = useState(false); // open drawer for add/edit role
  const [isRefresh, setIsRefresh] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { translate } = useTranslate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  const { data, getConfig, isLoading, isDeleting, removeConfig, updateConfig } =
    useAppState(RootState.CONFIGURATION);

  const {
    user: { id: userId },
  } = useAppState(RootState.AUTH);

  const queryParams = new URLSearchParams(location.search);
  const attribute = queryParams.get("attribute");

  useEffect(() => {
    if (attribute) {
      setCreateDrawer(true);
    }
  }, [attribute]);

  useEffect(() => {
    getConfig();
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) getConfig(false);
    setIsLoaded(true);
  }, [isRefresh]);

  const handleClickDelete = async (id: string) => {
    try {
      const result = await removeConfig(id);
      toast.success("config deleted successfully", { id: "delete-config" });

      setIsRefresh((prev) => !prev);

      return result;
    } catch (error) {
      console.error("handleClickDelete error =>", error);
    }
  };

  const handleUpdate = async (id: string, payload: any) => {
    return;
    try {
      const result = await updateConfig(id, payload);
      toast.success("config updated successfully", { id: "update-config" });

      setIsRefresh((prev) => !prev);

      return result;
    } catch (error) {
      console.error("handleUpdate error =>", error);

      const err = get(
        error,
        "response.data.errors",
        "Something went wrong, please try again later",
      );

      toast.error(err, { id: "update-config" });
    }
  };

  const GuideTips = ({ children }: { children: any }) => (
    <Tooltip
      content={
        <div className="w-52">
          <p>
            Enabling and disabling a field is planned for the full product. For
            now, in pilot,
          </p>
          <p>
            this feature is not yet enabled. To make changes to these fields
            being including/excluded for your installation, please talk to the
            AthenaPro.ai team
          </p>
        </div>
      }
    >
      {children}
    </Tooltip>
  );
  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor("name", {
        header: () => (
          <Table.Head
            icon={allImgPaths.queues}
            label={translate("admin.config.columns.name")}
          />
        ),
        cell: ({ getValue, row }) => (
          <Table.Cell className="flex items-center justify-between w-full font-normal gap-x-2">
            <span>{getValue()}</span>
            <div className="p-1 text-xs border rounded-full bg-secondary-200 border-secondary-900 text-primary-900">
              {toUpper(replace(get(row, "original.input_type", ""), "_", " "))}
            </div>
          </Table.Cell>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("description", {
        header: () => (
          <Table.Head
            icon={allImgPaths.describeIcon}
            label={translate("admin.config.columns.description")}
          />
        ),
        cell: (info: any) => (
          <Table.Cell className="font-normal max-w-[82%]">
            <ReadMore text={info.getValue()} limit={50} />
          </Table.Cell>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("is_enabled", {
        header: () => (
          <Table.Head label={translate("admin.config.columns.status")} />
        ),
        cell: ({ row }) => (
          <GuideTips>
            <Switch
              disabled={true}
              onChange={() => {
                handleUpdate(row.original.id, {
                  name: row.original.name,
                  is_enabled: !row.original.is_enabled,
                });
              }}
              checked={true}
            />
          </GuideTips>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("is_displayed_on_ke", {
        header: () => (
          <Table.Head
            label={translate("admin.config.columns.isDisplayedOnKE")}
          />
        ),
        cell: ({ getValue, row }) => (
          <GuideTips>
            <Switch
              onChange={() => {
                handleUpdate(row.original.id, {
                  name: row.original.name,
                  is_displayed_on_ke: !row.original.is_displayed_on_ke,
                });
              }}
              checked={Boolean(getValue())}
            />
          </GuideTips>
        ),
        enableSorting: false,
      }),
      // columnHelper.accessor((row) => row, {
      //   id: "Action",
      //   header: () => (
      //     <Table.Head className="justify-center w-full">
      //       <span className="text-base font-medium text-center text-status-info">
      //         {translate("common.action")}
      //       </span>
      //     </Table.Head>
      //   ),
      //   cell: ({ getValue, row }) => (
      //     <div className="flex items-center gap-x-1.5 w-full justify-center">
      //       {row.original.attribute_type === "CUSTOM_ATTRIBUTE" && (
      //         <Popover
      //           classes="!p-3 !rounded-lg"
      //           trigger={
      //             <span className="flex items-center justify-center w-10 h-10 duration-200 rounded-md cursor-pointer select-none hover:bg-status-brand/20 gap-x-1">
      //               <img className="w-5 h-5" src={allImgPaths.more} />
      //             </span>
      //           }
      //           content={
      //             <div className="flex flex-col w-24 gap-y-1">
      //               <div
      //                 className="flex items-center p-2 duration-300 cursor-pointer gap-x-2"
      //                 onClick={() => {
      //                   setCreateDrawer(true);
      //                   setSearchParams({ attribute: getValue().id });
      //                 }}
      //               >
      //                 <img src={allImgPaths.edit} alt="edit" />
      //                 <span>{translate("common.edit")}</span>
      //               </div>
      //               <div
      //                 className="flex items-center p-2 duration-300 cursor-pointer gap-x-2 text-status-error"
      //                 onClick={() => {
      //                   confirmAlert({
      //                     customUI: ({ onClose }) => {
      //                       return (
      //                         <Modal size="lg" show={true} onClose={onClose}>
      //                           <div className="flex flex-col gap-y-10">
      //                             <div>
      //                               <div className="flex justify-center">
      //                                 <img
      //                                   src={allImgPaths.fileIcon}
      //                                   alt="file-icon"
      //                                 />
      //                               </div>
      //                               <div className="mt-4">
      //                                 <p className="text-base font-medium text-center capitalize">
      //                                   {translate(
      //                                     "admin.config.deleteConfirmMsg",
      //                                   )}
      //                                 </p>
      //                               </div>
      //                             </div>
      //                             <div className="flex justify-center gap-x-5">
      //                               <div>
      //                                 <ButtonV2
      //                                   onClick={onClose}
      //                                   variant="tertiaryDark"
      //                                 >
      //                                   {translate("common.cancel")}
      //                                 </ButtonV2>
      //                               </div>
      //                               <div>
      //                                 <ButtonV2
      //                                   onClick={async () => {
      //                                     await handleClickDelete(
      //                                       getValue().id,
      //                                     );

      //                                     onClose();
      //                                   }}
      //                                   className="min-w-32"
      //                                   variant="primary"
      //                                   rightIcon={allImgPaths.rightArrow}
      //                                 >
      //                                   {translate("common.ok")}
      //                                 </ButtonV2>
      //                               </div>
      //                             </div>
      //                           </div>
      //                         </Modal>
      //                       );
      //                     },
      //                   });
      //                 }}
      //               >
      //                 <img src={allImgPaths.trash} alt="edit" />
      //                 <span>{translate("common.delete")}</span>
      //               </div>
      //             </div>
      //           }
      //           position="left"
      //         />
      //       )}
      //     </div>
      //   ),
      //   enableSorting: false,
      // }),
    ];
    return isLoading || !isLoaded
      ? columns.map((o: any) => {
          return {
            ...o,
            cell: () => <Loader count={1} className="!h-10" />,
          };
        })
      : columns;
  }, [isLoading, isDeleting, isLoaded, userId, data]);

  const _data = React.useMemo(
    () => (isLoading || !isLoaded ? Array(LOADING_ROWS).fill({}) : data),
    [isLoading, data, isLoaded],
  );

  const table = useReactTable({
    data: _data,
    columns,
    filterFns: {},
    state: {},
    initialState: {},
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
  });

  const customAttributesSize = useMemo(() => {
    const { CUSTOM_ATTRIBUTE } = countBy(_data, "attribute_type");
    return CUSTOM_ATTRIBUTE;
  }, [_data]);

  return (
    <div className="w-full h-full">
      <PermissionGate
        action={ACTION.READ}
        page={PAGES.ROLES}
        errorComponent={
          <UnauthorizedAccess
            header={translate("admin.config.restrictedMsg.heading")}
            message={translate("admin.config.restrictedMsg.message")}
          />
        }
      >
        <div className="flex justify-end mb-[15px]">
          <div className="flex gap-x-6 min-w-[193px]">
            <Tooltip
              place="top"
              color="primary"
              content={
                customAttributesSize >= 3
                  ? "Maximum of 3 custom attributes are allowed in the system."
                  : ""
              }
            >
              <ButtonV2
                disabled={true || customAttributesSize >= 3}
                onClick={() => {
                  setCreateDrawer(true);
                }}
              >
                {translate("admin.config.addNewBtn")}
              </ButtonV2>
            </Tooltip>
          </div>
        </div>

        {isLoading ? (
          <LoaderCircle />
        ) : (
          <Table
            table={table}
            emptyRecordMsg={{
              heading: translate("common.noRecordMatch"),
              description: translate("admin.roles.noRecordFoundDescription"),
            }}
            // className="grid border-b grid-cols-[minmax(300px,25%)_minmax(250px,60%)_minmax(250px,5%)_minmax(250px,5%)_minmax(80px,5%)]"
            className="grid border-b grid-cols-[minmax(300px,20%)_minmax(250px,80%)_minmax(180px,0%)_minmax(180px,0%)]"
            bodyClassName="h-auto"
          />
        )}
      </PermissionGate>

      {/* Create Roles */}
      <Drawer
        size="md"
        show={createDrawer}
        onClose={() => {
          setCreateDrawer(false);
          setSearchParams({});
        }}
        icon={allImgPaths.rightIcon}
        title={
          attribute
            ? translate("admin.config.form.editHeading")
            : translate("admin.config.form.newHeading")
        }
      >
        {createDrawer && (
          <Create
            onClose={() => {
              setCreateDrawer(false);
              setSearchParams({});

              // check if page is not first then set to first page else refresh the record with same pagination
              setIsRefresh((prev) => !prev);
            }}
          />
        )}
      </Drawer>
    </div>
  );
};

export default Roles;
