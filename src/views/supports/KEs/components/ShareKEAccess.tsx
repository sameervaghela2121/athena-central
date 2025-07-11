import allImgPaths from "@/assets";
import { LoaderCircle } from "@/components";
import AccessControl from "@/components/KEs/AccessControl";
import useAppState, { RootState } from "@/context/useAppState";
import { ACCESS_ROLE, SAVE_MODE } from "@/shared/constants";
import { KEEntry } from "@/validations";
import { yupResolver } from "@hookform/resolvers/yup";
import { filter, get, map, omit, reject, size } from "lodash-es";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const ShareKEAccess = ({ onClose, KEId }: { onClose: any; KEId: string }) => {
  const [isFetching, setIsFetching] = useState(false);
  const [KEData, setKEData] = useState<{
    data: any;
    message?: string;
    error?: string;
  }>({
    data: null,
    message: "",
  });

  const PERMISSIONS_OPTIONS = [
    {
      id: ACCESS_ROLE.OWNER,
      name: (
        <div className="flex gap-x-2 items-center">
          <img src={allImgPaths.userSecondary} />
          <span className="font-medium text-tertiary-700">
            {ACCESS_ROLE.OWNER}
          </span>
        </div>
      ),
    },
    {
      id: ACCESS_ROLE.EDITOR,
      name: (
        <div className="flex gap-x-2 items-center">
          <img src={allImgPaths.editIcon} />
          <span className="font-medium text-tertiary-700">
            {ACCESS_ROLE.EDITOR}
          </span>
        </div>
      ),
    },
    {
      id: ACCESS_ROLE.VIEWER,
      name: (
        <div className="flex gap-x-2 items-center">
          <img src={allImgPaths.viewEye} />
          <span className="font-medium text-tertiary-700">
            {ACCESS_ROLE.VIEWER}
          </span>
        </div>
      ),
    },
  ];

  const { updateKE, getKEById, toggleLockKE } = useAppState(RootState.KE);
  const {
    user: { is_entity_enabled = false, is_corporate_entity = false },
  } = useAppState(RootState.AUTH);

  const { watch, setValue, getValues } = useForm({
    defaultValues: {
      status: SAVE_MODE.DRAFT,
      attributes: {},
      users: [],
      users_access: [],
      documents: [],
      usersViewAccess: [],
      usersEditAccess: [],
      attributes_access: [],
      addMemberByType: "BY_SPECIFIC_PEOPLE",
      view: {
        giveAllViewAccess: true,
        giveCustomViewAccess: false,
        byAttribute: false,
        byName: false,
        include_all_franchises: true,
      },
      edit: {
        editAccessToAllAdmins: false,
        giveAllEditAccess: true,
        giveCustomEditAccess: false,
      },
    },
    mode: "all",
    reValidateMode: "onChange",
    resolver: yupResolver(KEEntry),
  });

  const formValues = watch(); // watch all form fields

  const { attributes_access = [] }: any = formValues;

  const fetchKEData = async (KEId: string) => {
    try {
      setIsFetching(true);

      const { result } = await getKEById(KEId);

      let attributes_access = result.attributes_access;

      let users_access = [];

      if (size(result.users_access) > 0) {
        users_access = result.users_access.map((userAccess: any) => {
          const findPermission: any = PERMISSIONS_OPTIONS.find(
            (perm) => perm.id === userAccess.permissions,
          );

          if (userAccess.user) {
            const user = {
              label: `${userAccess.user.name}(${userAccess.user.username})`,
              name: `${userAccess.user.name}`,
              username: `${userAccess.user.username}`,
              value: userAccess.user.id,
              permissions: findPermission.id,
            };

            return user;
          }
        });
      }

      const editAccessToAllAdmins = get(
        result,
        "edit_access_to_all_admins",
        false,
      );
      const giveAllEditAccess = get(
        result,
        "edit_access_to_all_queue_supporters",
        false,
      );
      const viewAccessToAllUsers = get(
        result,
        "view_access_to_all_users",
        false,
      );

      if (viewAccessToAllUsers) {
        attributes_access = [];
      }

      setValue("attributes_access", attributes_access, {
        shouldValidate: false,
      });

      const editorUsers = filter(users_access, {
        permissions: ACCESS_ROLE.EDITOR,
      });
      const viewerUsers = filter(users_access, {
        permissions: ACCESS_ROLE.VIEWER,
      });

      if (viewAccessToAllUsers) {
        setValue("usersViewAccess", []);
      } else {
        setValue("usersViewAccess", viewerUsers);
      }

      if (giveAllEditAccess || editAccessToAllAdmins) {
        setValue("usersEditAccess", []);
      } else {
        setValue("usersEditAccess", editorUsers);
      }

      setValue("view", {
        giveAllViewAccess: viewAccessToAllUsers,
        giveCustomViewAccess: !viewAccessToAllUsers,
        byAttribute: size(attributes_access) > 0,
        byName: size(viewerUsers) > 0,
        include_all_franchises: get(result, "include_all_franchises", false),
      });
      setValue("edit", {
        editAccessToAllAdmins: editAccessToAllAdmins,
        giveAllEditAccess: giveAllEditAccess,
        giveCustomEditAccess: !giveAllEditAccess && !editAccessToAllAdmins,
      });

      setValue("status", result.status);
      setValue("documents", result.documents);

      setIsFetching(false);

      setKEData({
        data: result.result,
        message: result.message,
      });
    } catch (error) {
      console.error("fetchKEData error =>", error);
    }
  };

  useEffect(() => {
    if (KEId) {
      fetchKEData(KEId).then(() => {});
    }
  }, [KEId]);

  const updateKERecord = async () => {
    const data = watch();

    const usersEditAccess = get(data, "usersEditAccess", []);
    const documentIds = filter(map(get(data, "documents", []), "document_id")); /// retrieve documentIds and remove nullish document

    const usersViewAccess = get(data, "usersViewAccess", []);
    const status = get(data, "status", SAVE_MODE.DRAFT);
    const view_access_to_all_users = get(data, "view.giveAllViewAccess", false);
    const byName = get(data, "view.byName", false);
    const edit_access_to_all_queue_supporters = get(
      data,
      "edit.giveAllEditAccess",
      false,
    );
    const edit_access_to_all_admins = get(
      data,
      "edit.editAccessToAllAdmins",
      false,
    );

    const include_all_franchises = get(
      data,
      "view.include_all_franchises",
      false,
    );

    const payload: any = {
      status,
      users_access: [],
      document_ids: documentIds,
      attributes_access: [],
      view_access_to_all_users,
      edit_access_to_all_queue_supporters,
      edit_access_to_all_admins,
      include_all_franchises:
        is_entity_enabled && is_corporate_entity
          ? include_all_franchises
          : false,
    };

    let users = [...usersEditAccess, ...usersViewAccess];

    if (edit_access_to_all_queue_supporters || edit_access_to_all_admins) {
      users = reject(users, { permissions: ACCESS_ROLE.EDITOR });
    }

    if (view_access_to_all_users) {
      users = reject(users, { permissions: ACCESS_ROLE.VIEWER });
    }

    payload.users_access = users.map((userAccess: any) => {
      return {
        user: userAccess.value,
        permissions: userAccess.permissions,
      };
    });

    if (!byName) {
      payload.users_access = reject(payload.users_access, {
        permissions: ACCESS_ROLE.VIEWER,
      });
    }

    if (!view_access_to_all_users) {
      payload.attributes_access = attributes_access.map((attributes: any) => {
        return {
          ...omit(attributes, ["count", "users"]),
        };
      });
    }

    let msg = "";

    try {
      if (KEId) {
        await toggleLockKE(KEId, "lock");
        const data = await updateKE(KEId, payload);
        msg = get(data, "data.message", "KE updated successfully");
        onClose();
      }
    } catch (error) {
      console.error("saveKE error =>", error);

      const err = get(
        error,
        "response.data.data.message",
        "Something went wrong. Please try again",
      );

      console.error("saveKE error =>", err);
      toast.error(err, { id: "err-KE" });
    } finally {
      await toggleLockKE(KEId, "unlock");
    }
  };

  return (
    <div>
      {isFetching ? (
        <div className="min-h-[754px] flex justify-center">
          <LoaderCircle />
        </div>
      ) : (
        <AccessControl
          setValue={setValue}
          getValues={getValues}
          formValues={formValues}
          onClose={() => onClose()}
          onApply={() => updateKERecord()}
        />
      )}
    </div>
  );
};

export default ShareKEAccess;
